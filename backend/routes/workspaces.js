const express = require("express")
const { body, validationResult } = require("express-validator")
const Workspace = require("../models/Workspace")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get user's workspaces
router.get("/", auth, async (req, res) => {
  try {
    const workspaces = await Workspace.find({
      $or: [{ owner: req.user.id }, { "members.user": req.user.id }],
    })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .populate("boards", "title description background")

    res.json(workspaces)
  } catch (error) {
    console.error("Get workspaces error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create workspace
router.post(
  "/",
  auth,
  [
    body("name")
      .trim()
      .isLength({ min: 1, max: 100 })
      .withMessage("Name is required and must be less than 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { name, description } = req.body

      const workspace = new Workspace({
        name,
        description,
        owner: req.user.id,
        members: [
          {
            user: req.user.id,
            role: "admin",
          },
        ],
      })

      await workspace.save()
      await workspace.populate("owner", "name email avatar")
      await workspace.populate("members.user", "name email avatar")

      // Add workspace to user's workspaces
      await User.findByIdAndUpdate(req.user.id, {
        $push: { workspaces: workspace._id },
      })

      res.status(201).json(workspace)
    } catch (error) {
      console.error("Create workspace error:", error)
      res.status(500).json({ message: "Server error" })
    }
  },
)

// Get workspace by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar")
      .populate("boards", "title description background visibility")

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" })
    }

    // Check if user is member or owner
    const isMember =
      workspace.owner._id.toString() === req.user.id ||
      workspace.members.some((member) => member.user._id.toString() === req.user.id)

    if (!isMember) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(workspace)
  } catch (error) {
    console.error("Get workspace error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
