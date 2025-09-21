const express = require("express")
const { body, validationResult } = require("express-validator")
const Comment = require("../models/Comment")
const Card = require("../models/Card")
const Activity = require("../models/Activity")
const auth = require("../middleware/auth")

const router = express.Router()

// Add comment to card
router.post(
  "/",
  auth,
  [
    body("text")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Comment text is required and must be less than 1000 characters"),
    body("cardId").isMongoId().withMessage("Valid card ID is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { text, cardId } = req.body

      // Get card and check access
      const card = await Card.findById(cardId).populate("board")
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

      const comment = new Comment({
        text,
        card: cardId,
        author: req.user.id,
      })

      await comment.save()
      await comment.populate("author", "name email avatar")

      // Add comment to card
      await Card.findByIdAndUpdate(cardId, {
        $push: { comments: comment._id },
      })

      // Log activity
      const activity = new Activity({
        type: "comment_added",
        actor: req.user.id,
        board: card.board._id,
        card: cardId,
        comment: comment._id,
        description: `commented on card "${card.title}"`,
      })
      await activity.save()

      // Emit real-time event
      req.io.to(`board-${card.board._id}`).emit("comment-added", {
        comment,
        cardId,
        boardId: card.board._id,
        userId: req.user.id,
        userName: req.user.name,
      })

      res.status(201).json(comment)
    } catch (error) {
      console.error("Add comment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get comments for a card
router.get("/card/:cardId", auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.cardId).populate("board")
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

    const comments = await Comment.find({ card: req.params.cardId })
      .populate("author", "name email avatar")
      .sort({ createdAt: 1 })

    res.json(comments)
  } catch (error) {
    console.error("Get comments error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
