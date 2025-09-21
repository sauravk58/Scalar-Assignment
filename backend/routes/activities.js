const express = require("express")
const Activity = require("../models/Activity")
const Board = require("../models/Board")
const auth = require("../middleware/auth")

const router = express.Router()

// Get activities for a board
router.get("/board/:boardId", auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const boardId = req.params.boardId

    // Check if user has access to board
    const board = await Board.findById(boardId)
    if (!board) {
      return res.status(404).json({ message: "Board not found" })
    }

    const isMember =
      board.owner.toString() === req.user.id || board.members.some((member) => member.user.toString() === req.user.id)

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    const activities = await Activity.find({ board: boardId })
      .populate("actor", "name email avatar")
      .populate("card", "title")
      .populate("list", "title")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)

    const total = await Activity.countDocuments({ board: boardId })

    res.json({
      activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    })
  } catch (error) {
    console.error("Get activities error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
