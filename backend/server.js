const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const { createServer } = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const workspaceRoutes = require("./routes/workspaces")
const boardRoutes = require("./routes/boards")
const listRoutes = require("./routes/lists")
const cardRoutes = require("./routes/cards")
const commentRoutes = require("./routes/comments")
const activityRoutes = require("./routes/activities")

const app = express()
const server = createServer(app)

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "*" || process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
})

// Security middleware
app.use(helmet())
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
)

// CORS configuration
app.use(
  cors(),
)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true }))

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err))

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  const userId = socket.handshake.auth.userId
  const userName = socket.handshake.auth.userName

  // Join board room
  socket.on("join-board", (boardId) => {
    socket.join(`board-${boardId}`)
    socket.boardId = boardId
    console.log(`User ${socket.id} (${userName}) joined board ${boardId}`)

    // Notify other users in the board
    socket.to(`board-${boardId}`).emit("user-joined-board", {
      userId,
      userName,
      socketId: socket.id,
    })
  })

  // Leave board room
  socket.on("leave-board", (boardId) => {
    socket.leave(`board-${boardId}`)
    console.log(`User ${socket.id} (${userName}) left board ${boardId}`)

    // Notify other users in the board
    socket.to(`board-${boardId}`).emit("user-left-board", {
      userId,
      userName,
      socketId: socket.id,
    })
  })

  // Card moved event
  socket.on("card-moved", (data) => {
    console.log("Card moved:", data)
    socket.to(`board-${data.boardId}`).emit("card-moved", data)
  })

  // Card updated event
  socket.on("card-updated", (data) => {
    console.log("Card updated:", data)
    socket.to(`board-${data.boardId}`).emit("card-updated", data)
  })

  // Card created event
  socket.on("card-created", (data) => {
    console.log("Card created:", data)
    socket.to(`board-${data.boardId}`).emit("card-created", data)
  })

  // List created event
  socket.on("list-created", (data) => {
    console.log("List created:", data)
    socket.to(`board-${data.boardId}`).emit("list-created", data)
  })

  // List updated event
  socket.on("list-updated", (data) => {
    console.log("List updated:", data)
    socket.to(`board-${data.boardId}`).emit("list-updated", data)
  })

  // List moved event
  socket.on("list-moved", (data) => {
    console.log("List moved:", data)
    socket.to(`board-${data.boardId}`).emit("list-moved", data)
  })

  // Comment added event
  socket.on("comment-added", (data) => {
    console.log("Comment added:", data)
    socket.to(`board-${data.boardId}`).emit("comment-added", data)
  })

  // Typing indicators
  socket.on("typing-start", (data) => {
    socket.to(`board-${data.boardId}`).emit("typing-start", data)
  })

  socket.on("typing-stop", (data) => {
    socket.to(`board-${data.boardId}`).emit("typing-stop", data)
  })

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    // Notify board members if user was in a board
    if (socket.boardId) {
      socket.to(`board-${socket.boardId}`).emit("user-left-board", {
        userId,
        userName,
        socketId: socket.id,
      })
    }
  })
})

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/workspaces", workspaceRoutes)
app.use("/api/boards", boardRoutes)
app.use("/api/lists", listRoutes)
app.use("/api/cards", cardRoutes)
app.use("/api/comments", commentRoutes)
app.use("/api/activities", activityRoutes)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

if (process.env.NODE_ENV === "production") {
  const frontendPath = path.join(__dirname, "..", "frontend", "build")
  app.use(express.static(frontendPath))

  // Catch-all (let React Router handle other routes)
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(frontendPath, "index.html"))
  })
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  })
})


const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

module.exports = { app, io }
