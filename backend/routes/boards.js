const express = require("express")
const { body, validationResult } = require("express-validator")
const Board = require("../models/Board")
const Workspace = require("../models/Workspace")
const List = require("../models/List")
const Card = require("../models/Card")
const Activity = require("../models/Activity")
const auth = require("../middleware/auth")

const router = express.Router()

// Get user's boards
router.get("/", auth, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
      closed: false,
    })
      .populate("workspace", "name")
      .populate("owner", "name email avatar")
      .sort({ updatedAt: -1 })

    res.json(boards)
  } catch (error) {
    console.error("Get boards error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create board
router.post(
  "/",
  auth,
  [
    body("title")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Title is required and must be less than 100 characters"),
    body("workspaceId").isMongoId().withMessage("Valid workspace ID is required"),
    body("visibility").optional().isIn(["private", "workspace", "public"]).withMessage("Invalid visibility option"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { title, description, workspaceId, visibility = "workspace", background = "#0079bf" } = req.body

      // Check if user has access to workspace
      const workspace = await Workspace.findById(workspaceId)
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" })
      }

      const isMember =
        workspace.owner.toString() === req.user.id ||
        workspace.members.some((member) => member.user.toString() === req.user.id)

      if (!isMember) {
        return res.status(403).json({ message: "Access denied to workspace" })
      }

      const board = new Board({
        title,
        description,
        workspace: workspaceId,
        owner: req.user.id,
        visibility,
        background,
        members: [
          {
            user: req.user.id,
            role: "owner",
          },
        ],
      })

      await board.save()
      await board.populate("workspace", "name")
      await board.populate("owner", "name email avatar")

      // Add board to workspace
      await Workspace.findByIdAndUpdate(workspaceId, {
        $push: { boards: board._id },
      })

      // Create default lists
      const defaultLists = ["To Do", "In Progress", "Done"]
      for (let i = 0; i < defaultLists.length; i++) {
        const list = new List({
          title: defaultLists[i],
          board: board._id,
          position: (i + 1) * 1024,
        })
        await list.save()
        board.lists.push(list._id)
      }
      await board.save()

      // Log activity
      const activity = new Activity({
        type: "board_created",
        actor: req.user.id,
        board: board._id,
        description: `created board "${title}"`,
      })
      await activity.save()

      res.status(201).json(board)
    } catch (error) {
      console.error("Create board error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get board by ID with full data
router.get("/:id", auth, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate("workspace", "name")
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .populate({
        path: "lists",
        populate: {
          path: "cards",
          populate: [
            { path: "assignees", select: "name email avatar" },
            { path: "creator", select: "name email avatar" },
          ],
        },
      })

    if (!board) {
      return res.status(404).json({ message: "Board not found" })
    }

    // Check access permissions
    const isMember =
      board.owner._id.toString() === req.user.id ||
      board.members.some((member) => member.user._id.toString() === req.user.id)

    if (!isMember && board.visibility === "private") {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(board)
  } catch (error) {
    console.error("Get board error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Search cards in board
router.get("/:id/search", auth, async (req, res) => {
  try {
    const { q, labels, assignees, dueDate } = req.query

    const board = await Board.findById(req.params.id)
    if (!board) {
      return res.status(404).json({ message: "Board not found" })
    }

    // Check access
    const isMember =
      board.owner.toString() === req.user.id || board.members.some((member) => member.user.toString() === req.user.id)

    if (!isMember && board.visibility === "private") {
      return res.status(403).json({ message: "Access denied" })
    }

    const query = { board: req.params.id, archived: false }

    // Text search
    if (q) {
      query.$text = { $search: q }
    }

    // Filter by labels
    if (labels) {
      const labelArray = labels.split(",")
      query.labels = { $in: labelArray }
    }

    // Filter by assignees
    if (assignees) {
      const assigneeArray = assignees.split(",")
      query.assignees = { $in: assigneeArray }
    }

    // Filter by due date
    if (dueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      switch (dueDate) {
        case "overdue":
          query.dueDate = { $lt: today }
          break
        case "today":
          query.dueDate = { $gte: today, $lt: tomorrow }
          break
        case "week":
          const nextWeek = new Date(today)
          nextWeek.setDate(nextWeek.getDate() + 7)
          query.dueDate = { $gte: today, $lt: nextWeek }
          break
      }
    }

    const cards = await Card.find(query)
      .populate("list", "title")
      .populate("assignees", "name email avatar")
      .populate("creator", "name email avatar")
      .sort({ position: 1 })
      .limit(50)

    res.json(cards)
  } catch (error) {
    console.error("Search cards error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
