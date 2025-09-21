const express = require("express")
const { body, validationResult } = require("express-validator")
const Card = require("../models/Card")
const List = require("../models/List")
const Board = require("../models/Board")
const Activity = require("../models/Activity")
const auth = require("../middleware/auth")

const router = express.Router()

// Create card
router.post(
  "/",
  auth,
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title is required and must be less than 200 characters"),
    body("listId").isMongoId().withMessage("Valid list ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { title, description, listId, position } = req.body

      // Get list and board info
      const list = await List.findById(listId).populate("board")
      if (!list) {
        return res.status(404).json({ message: "List not found" })
      }

      // Check access
      const isMember =
        list.board.owner.toString() === req.user.id ||
        list.board.members.some((member) => member.user.toString() === req.user.id)

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Calculate position if not provided
      let cardPosition = position
      if (!cardPosition) {
        const lastCard = await Card.findOne({ list: listId }).sort({ position: -1 })
        cardPosition = lastCard ? lastCard.position + 1024 : 1024
      }

      const card = new Card({
        title,
        description,
        list: listId,
        board: list.board._id,
        position: cardPosition,
        creator: req.user.id,
      })

      await card.save()
      await card.populate("creator", "name email avatar")

      // Add card to list
      await List.findByIdAndUpdate(listId, {
        $push: { cards: card._id },
      })

      // Log activity
      const activity = new Activity({
        type: "card_created",
        actor: req.user.id,
        board: list.board._id,
        card: card._id,
        list: listId,
        description: `added card "${title}" to "${list.title}"`,
      })
      await activity.save()

      // Emit real-time event
      req.io.to(`board-${list.board._id}`).emit("card-created", {
        card,
        boardId: list.board._id,
        userId: req.user.id,
        userName: req.user.name,
      })

      res.status(201).json(card)
    } catch (error) {
      console.error("Create card error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Move card
router.put(
  "/:id/move",
  auth,
  [
    body("listId").isMongoId().withMessage("Valid list ID is required"),
    body("position").isNumeric().withMessage("Position is required and must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { listId, position } = req.body
      const card = await Card.findById(req.params.id).populate("board list")

      if (!card) {
        return res.status(404).json({ message: "Card not found" })
      }

      // Check access
      const isMember =
        card.board.owner.toString() === req.user.id ||
        card.board.members.some((member) => member.user.toString() === req.user.id)

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      const oldListId = card.list._id
      const oldList = card.list

      // Update card
      card.list = listId
      card.position = position
      await card.save()

      // Update lists
      if (oldListId.toString() !== listId) {
        // Remove from old list
        await List.findByIdAndUpdate(oldListId, {
          $pull: { cards: card._id },
        })

        // Add to new list
        await List.findByIdAndUpdate(listId, {
          $push: { cards: card._id },
        })

        // Get new list info for activity
        const newList = await List.findById(listId)

        // Log activity
        const activity = new Activity({
          type: "card_moved",
          actor: req.user.id,
          board: card.board._id,
          card: card._id,
          description: `moved card "${card.title}" from "${oldList.title}" to "${newList.title}"`,
        })
        await activity.save()
      }

      // Emit real-time event
      req.io.to(`board-${card.board._id}`).emit("card-moved", {
        cardId: card._id,
        fromListId: oldListId,
        toListId: listId,
        newPosition: position,
        boardId: card.board._id,
        userId: req.user.id,
        userName: req.user.name,
      })

      res.json(card)
    } catch (error) {
      console.error("Move card error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Update card
router.put(
  "/:id",
  auth,
  [
    body("title")
      .optional()
      .trim()
      .isLength({ min: 1, max: 200 })
      .withMessage("Title must be less than 200 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Description must be less than 2000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const updates = req.body
      const card = await Card.findById(req.params.id).populate("board assignees creator")

      if (!card) {
        return res.status(404).json({ message: "Card not found" })
      }

      // Check access
      const isMember =
        card.board.owner.toString() === req.user.id ||
        card.board.members.some((member) => member.user.toString() === req.user.id)

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      // Update card
      Object.keys(updates).forEach((key) => {
        if (updates[key] !== undefined) {
          card[key] = updates[key]
        }
      })

      await card.save()

      // Log activity for significant changes
      if (updates.title || updates.description || updates.dueDate) {
        const activity = new Activity({
          type: "card_updated",
          actor: req.user.id,
          board: card.board._id,
          card: card._id,
          description: `updated card "${card.title}"`,
        })
        await activity.save()
      }

      // Emit real-time event
      req.io.to(`board-${card.board._id}`).emit("card-updated", {
        cardId: card._id,
        updates,
        boardId: card.board._id,
        userId: req.user.id,
        userName: req.user.name,
      })

      res.json(card)
    } catch (error) {
      console.error("Update card error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)
router.delete("/:id", auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id).populate("board list")
    if (!card) {
  return res.json({ message: "Card already deleted" })
}

    // Check access
    const isMember =
      card.board.owner.toString() === req.user.id ||
      card.board.members.some((member) => member.user.toString() === req.user.id)

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Remove from list
    await List.findByIdAndUpdate(card.list._id, {
      $pull: { cards: card._id },
    })

    // Delete the card
    await card.deleteOne()

    // Log activity
    const activity = new Activity({
      type: "card_deleted",
      actor: req.user.id,
      board: card.board._id,
      card: card._id,
      description: `deleted card "${card.title}" from "${card.list.title}"`,
    })
    await activity.save()

    // Emit real-time event (to update other clients)
    req.io.to(`board-${card.board._id}`).emit("card-deleted", {
      cardId: card._id,
      listId: card.list._id,
      boardId: card.board._id,
      userId: req.user.id,
      userName: req.user.name,
    })

    res.json({ message: "Card deleted successfully" })
  } catch (error) {
    console.error("Delete card error:", error)
    res.status(500).json({ message: "Server error" })
  }
})
module.exports = router
