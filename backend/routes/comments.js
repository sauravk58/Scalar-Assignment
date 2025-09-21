const express = require("express")
const { body, validationResult } = require("express-validator")
const Comment = require("../models/Comment")
const Card = require("../models/Card")
const Activity = require("../models/Activity")
const auth = require("../middleware/auth")

const router = express.Router()

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
      card.board.members.some(
        (member) => member.user.toString() === req.user.id
      )

    if (!isMember && card.board.visibility === "private") {
      return res.status(403).json({ message: "Access denied" })
    }

    const comments = await Comment.find({ card: req.params.cardId })
      .populate("author", "name email avatar")
      .populate("mentions", "name email")
      .sort({ createdAt: -1 })

    res.json(comments)
  } catch (error) {
    console.error("Get comments error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create comment
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

      const card = await Card.findById(cardId).populate("board")
      if (!card) {
        return res.status(404).json({ message: "Card not found" })
      }

      // Check access
      const isMember =
        card.board.owner.toString() === req.user.id ||
        card.board.members.some(
          (member) => member.user.toString() === req.user.id
        )

      if (!isMember) {
        return res.status(403).json({ message: "Access denied" })
      }

      const comment = new Comment({
        text,
        author: req.user.id,
        card: cardId,
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
        description: `commented on "${card.title}"`,
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
      console.error("Create comment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
)

// Update comment
router.put(
  "/:id",
  auth,
  [
    body("text")
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Comment text is required and must be less than 1000 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { text } = req.body

      const comment = await Comment.findById(req.params.id)
        .populate("author", "name email avatar")
        .populate({
          path: "card",
          populate: { path: "board" },
        })

      if (!comment) {
        return res.status(404).json({ message: "Comment not found" })
      }

      // Check if user is the author
      if (comment.author._id.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied" })
      }

      comment.text = text
      comment.edited = true
      comment.editedAt = new Date()
      await comment.save()

      // Log activity
      const activity = new Activity({
        type: "comment_updated",
        actor: req.user.id,
        board: comment.card.board._id,
        card: comment.card._id,
        comment: comment._id,
        description: `updated comment on "${comment.card.title}"`,
      })
      await activity.save()

      res.json(comment)
    } catch (error) {
      console.error("Update comment error:", error)
      res.status(500).json({ message: "Server error" })
    }
  }
)

// Delete comment
router.delete("/:id", auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id).populate({
      path: "card",
      populate: { path: "board" },
    })

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" })
    }

    // Check if user is the author or board owner
    const isAuthor = comment.author.toString() === req.user.id
    const isBoardOwner = comment.card.board.owner.toString() === req.user.id

    if (!isAuthor && !isBoardOwner) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Remove comment from card
    await Card.findByIdAndUpdate(comment.card._id, {
      $pull: { comments: comment._id },
    })

    // Delete comment
    await Comment.findByIdAndDelete(req.params.id)

    // Log activity
    const activity = new Activity({
      type: "comment_deleted",
      actor: req.user.id,
      board: comment.card.board._id,
      card: comment.card._id,
      description: `deleted comment on "${comment.card.title}"`,
    })
    await activity.save()

    res.json({ message: "Comment deleted successfully" })
  } catch (error) {
    console.error("Delete comment error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router