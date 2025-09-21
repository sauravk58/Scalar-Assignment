const express = require("express")
const { body, validationResult } = require("express-validator")
const List = require("../models/List")
const Board = require("../models/Board")
const Card = require("../models/Card")
const Activity = require("../models/Activity")
const auth = require("../middleware/auth")

const router = express.Router()

// Get lists for a board
router.get("/board/:boardId", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
    if (!board) {
      return res.status(404).json({ message: "Board not found" })
    }

    // Check access
    const isMember =
      board.owner.toString() === req.user.id ||
      board.members.some((member) => member.user.toString() === req.user.id)

    if (!isMember && board.visibility === "private") {
      return res.status(403).json({ message: "Access denied" })
    }

    const lists = await List.find({
      board: req.params.boardId,
      archived: false,
    })
      .populate({
        path: "cards",
        match: { archived: false },
        populate: [
          { path: "assignees", select: "name email avatar" },
          { path: "creator", select: "name email avatar" },
          { path: "comments" },
        ],
      })
      .sort({ position: 1 })

    res.json(lists)
  } catch (error) {
    console.error("Get lists error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create list
router.post(
  "/",
  auth,
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title is required and must be less than 100 characters"),
    body("boardId").isMongoId().withMessage("Valid board ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { title, boardId, position } = req.body

      const board = await Board.findById(boardId)
      if (!board) {
        return res.status(404).json({ message: "Board not found" })
      }

      // Check access
      const isMember =
        board.owner.toString() === req.user.id ||
        board.members.some((member) => member.user.toString() === req.user.id)

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Calculate position if not provided
      let listPosition = position
      if (!listPosition) {
        const lastList = await List.findOne({ board: boardId }).sort({
          position: -1,
        })
        listPosition = lastList ? lastList.position + 1024 : 1024
      }

      const list = new List({
        title,
        board: boardId,
        position: listPosition,
      })

      await list.save()

      // Add list to board
      await Board.findByIdAndUpdate(boardId, {
        $push: { lists: list._id },
      })

      // Log activity
      const activity = new Activity({
        type: "list_created",
        actor: req.user.id,
        board: boardId,
        list: list._id,
        description: `created list "${title}"`,
      })
      await activity.save()

      // Populate the list for response
      await list.populate("cards")

      // Emit real-time event
      req.io.to(`board-${boardId}`).emit("list-created", {
        list,
        boardId,
        userId: req.user.id,
        userName: req.user.name,
      })

      res.status(201).json(list)
    } catch (error) {
      console.error("Create list error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
)

// Update list
router.put(
  "/:id",
  auth,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title must be less than 100 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const list = await List.findById(req.params.id).populate("board")
      if (!list) {
        return res.status(404).json({ message: "List not found" })
      }

      // Check access
      const isMember =
        list.board.owner.toString() === req.user.id ||
        list.board.members.some(
          (member) => member.user.toString() === req.user.id
        )

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Update list
      const updates = req.body
      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined) {
          list[key] = updates[key]
        }
      })

      await list.save()

      // Log activity
      const activity = new Activity({
        type: "list_updated",
        actor: req.user.id,
        board: list.board._id,
        list: list._id,
        description: `updated list "${list.title}"`,
      })
      await activity.save()

      // Emit real-time event
      req.io.to(`board-${list.board._id}`).emit("list-updated", {
        listId: list._id,
        updates,
        boardId: list.board._id,
        userId: req.user.id,
        userName: req.user.name,
      })

      res.json(list)
    } catch (error) {
      console.error("Update list error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
)

// Move list
router.put(
  "/:id/move",
  auth,
  [
    body("position")
      .isNumeric()
      .withMessage("Position is required and must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { position } = req.body
      const list = await List.findById(req.params.id).populate("board")

      if (!list) {
        return res.status(404).json({ message: "List not found" })
      }

      // Check access
      const isMember =
        list.board.owner.toString() === req.user.id ||
        list.board.members.some(
          (member) => member.user.toString() === req.user.id
        )

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      list.position = position
      await list.save()

      // Log activity
      const activity = new Activity({
        type: "list_moved",
        actor: req.user.id,
        board: list.board._id,
        list: list._id,
        description: `moved list "${list.title}"`,
      })
      await activity.save()

      // Emit real-time event
      req.io.to(`board-${list.board._id}`).emit("list-moved", {
        listId: list._id,
        newPosition: position,
        boardId: list.board._id,
        userId: req.user.id,
        userName: req.user.name,
      })

      res.json(list)
    } catch (error) {
      console.error("Move list error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
)

// Archive list
router.put("/:id/archive", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id).populate("board")
    if (!list) {
      return res.status(404).json({ message: "List not found" })
    }

    // Check access
    const isMember =
      list.board.owner.toString() === req.user.id ||
      list.board.members.some(
        (member) => member.user.toString() === req.user.id
      )

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    list.archived = true
    await list.save()

    // Archive all cards in the list
    await Card.updateMany({ list: list._id }, { archived: true })

    // Log activity
    const activity = new Activity({
      type: "list_archived",
      actor: req.user.id,
      board: list.board._id,
      list: list._id,
      description: `archived list "${list.title}"`,
    })
    await activity.save()

    res.json({ message: "List archived successfully" })
  } catch (error) {
    console.error("Archive list error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Delete list
router.delete("/:id", auth, async (req, res) => {
  try {
    const list = await List.findById(req.params.id).populate("board")
    if (!list) {
      return res.status(404).json({ message: "List not found" })
    }

    // Check access
    const isMember =
      list.board.owner.toString() === req.user.id ||
      list.board.members.some(
        (member) => member.user.toString() === req.user.id
      )

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Delete all cards in the list
    await Card.deleteMany({ list: list._id })

    // Remove list from board
    await Board.findByIdAndUpdate(list.board._id, {
      $pull: { lists: list._id },
    })

    // Delete the list
    await List.findByIdAndDelete(req.params.id)

    // Log activity
    const activity = new Activity({
      type: "list_deleted",
      actor: req.user.id,
      board: list.board._id,
      description: `deleted list "${list.title}"`,
    })
    await activity.save()

    res.json({ message: "List deleted successfully" })
  } catch (error) {
    console.error("Delete list error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router