const express = require("express")
const { body, validationResult } = require("express-validator")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

// Register
router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { name, email, password } = req.body

      // Check if user already exists
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(409).json({
          message: "User already exists with this email",
        })
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
      })

      await user.save()

      // Generate token
      const token = generateToken(user._id)

      // Remove password from response
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.createdAt,
      }

      res.status(201).json({
        message: "User created successfully",
        token,
        user: userResponse,
      })
    } catch (error) {
      console.error("Register error:", error)
      res.status(500).json({ message: "Server error during registration" })
    }
  }
)

// Login
router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 1 })
      .withMessage("Password is required"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        })
      }

      const { email, password } = req.body

      // Find user by email
      const user = await User.findOne({ email })
      if (!user) {
        return res.status(401).json({
          message: "Invalid email or password",
        })
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password)
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Invalid email or password",
        })
      }

      // Update last active
      user.lastActive = new Date()
      await user.save()

      // Generate token
      const token = generateToken(user._id)

      // Remove password from response
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        lastActive: user.lastActive,
      }

      res.json({
        message: "Login successful",
        token,
        user: userResponse,
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ message: "Server error during login" })
    }
  }
)

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("workspaces", "name")
      .populate("boards", "title")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        workspaces: user.workspaces,
        boards: user.boards,
        lastActive: user.lastActive,
      },
    })
  } catch (error) {
    console.error("Get current user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Refresh token
router.post("/refresh", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const token = generateToken(user._id)
    res.json({ token })
  } catch (error) {
    console.error("Refresh token error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router