const express = require("express")
const Activity = require("../models/Activity")
const Board = require("../models/Board")
const auth = require("../middleware/auth")

const router = express.Router()

// Get activities for a board
router.get("/board/:boardId", auth, async (req, res) => {
  try {
    const { filter = "all", limit = 50, page = 1 } = req.query

    const board = await Board.findById(req.params.boardId)
    if (!board) {
      return res.status(404).json({ message: "Board not found" })
    }

    // Check access
    const isMember =
      board.owner.toString() === req.user.id ||
      board.members.some(
        (member) => member.user.toString() === req.user.id
      )

    if (!isMember && board.visibility === "private") {
      return res.status(403).json({ message: "Access denied" })
    }

    // Build filter query
    const query = { board: req.params.boardId }

    switch (filter) {
      case "comments":
        query.type = { $in: ["comment_added", "comment_updated", "comment_deleted"] }
        break
      case "moves":
        query.type = { $in: ["card_moved", "list_moved"] }
        break
      case "cards":
        query.type = { $in: ["card_created", "card_updated", "card_archived", "card_deleted"] }
        break
      case "lists":
        query.type = { $in: ["list_created", "list_updated", "list_moved", "list_archived"] }
        break
      default:
        // Return all activities
        break
    }

    const activities = await Activity.find(query)
      .populate("actor", "name email avatar")
      .populate("card", "title")
      .populate("list", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    res.json(activities)
  } catch (error) {
    console.error("Get activities error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get activities for a card
router.get("/card/:cardId", auth, async (req, res) => {
  try {
    const { limit = 20 } = req.query

    const activities = await Activity.find({ card: req.params.cardId })
      .populate("actor", "name email avatar")
      .populate("card", "title")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))

    res.json(activities)
  } catch (error) {
    console.error("Get card activities error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router