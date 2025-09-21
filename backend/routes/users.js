const express = require("express")
const { body, validationResult } = require("express-validator")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password")
    res.json(user)
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Update user profile
router.put(
  "/profile",
  auth,
  [
    body("name").optional().trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("avatar").optional().isURL().withMessage("Avatar must be a valid URL"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, avatar } = req.body
      const updateFields = {}

      if (name) updateFields.name = name
      if (avatar) updateFields.avatar = avatar

      const user = await User.findByIdAndUpdate(req.user.id, { $set: updateFields }, { new: true }).select("-password")

      res.json(user)
    } catch (error) {
      console.error("Update profile error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Search users by email (for inviting to boards)
router.get("/search", auth, async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" })
    }

    const users = await User.find({
      $or: [{ email: { $regex: q, $options: "i" } }, { name: { $regex: q, $options: "i" } }],
    })
      .select("name email avatar")
      .limit(10)

    res.json(users)
  } catch (error) {
    console.error("Search users error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
