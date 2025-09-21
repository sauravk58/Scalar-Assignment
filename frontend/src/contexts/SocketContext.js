"use client"

import { createContext, useContext, useEffect, useState } from "react"
import io from "socket.io-client"
import { useAuth } from "./AuthContext"
import toast from "react-hot-toast"

const SocketContext = createContext()

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      // Initialize socket connection
      const socketUrl = process.env.REACT_APP_BACKEND_SOCKET_URL || "http://localhost:4000"
      const newSocket = io(socketUrl, {
        auth: {
          userId: user.id,
          userName: user.name,
        },
      })

      // Connection event handlers
      newSocket.on("connect", () => {
        console.log("Connected to server")
        setConnected(true)
      })

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server")
        setConnected(false)
      })

      newSocket.on("connect_error", (error) => {
        console.error("Connection error:", error)
        toast.error("Connection error. Some features may not work.")
      })

      // User presence events
      newSocket.on("user-joined-board", (data) => {
        setOnlineUsers((prev) => new Set([...prev, data.userId]))
        if (data.userId !== user.id) {
          toast.success(`${data.userName} joined the board`, { duration: 2000 })
        }
      })

      newSocket.on("user-left-board", (data) => {
        setOnlineUsers((prev) => {
          const newSet = new Set(prev)
          newSet.delete(data.userId)
          return newSet
        })
        if (data.userId !== user.id) {
          toast(`${data.userName} left the board`, { duration: 2000 })
        }
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user])

  // Board-specific methods
  const joinBoard = (boardId) => {
    if (socket) {
      socket.emit("join-board", boardId)
    }
  }

  const leaveBoard = (boardId) => {
    if (socket) {
      socket.emit("leave-board", boardId)
    }
  }

  // Card operations
  const emitCardMoved = (cardId, fromListId, toListId, newPosition, boardId) => {
    if (socket) {
      socket.emit("card-moved", {
        cardId,
        fromListId,
        toListId,
        newPosition,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  const emitCardUpdated = (cardId, updates, boardId) => {
    if (socket) {
      socket.emit("card-updated", {
        cardId,
        updates,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  const emitCardCreated = (card, boardId) => {
    if (socket) {
      socket.emit("card-created", {
        card,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }
  const emitCardDeleted = (cardId, listId, boardId) => {
    if (socket) {
      socket.emit("card-deleted", {
        cardId,
        listId,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  // List operations
  const emitListCreated = (list, boardId) => {
    if (socket) {
      socket.emit("list-created", {
        list,
        boardId,
        userId: user.id,
        userName: user?.name,
      })
    }
  }

  const emitListUpdated = (listId, updates, boardId) => {
    if (socket) {
      socket.emit("list-updated", {
        listId,
        updates,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  const emitListMoved = (listId, newPosition, boardId) => {
    if (socket) {
      socket.emit("list-moved", {
        listId,
        newPosition,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  // Comment operations
  const emitCommentAdded = (comment, cardId, boardId) => {
    if (socket) {
      socket.emit("comment-added", {
        comment,
        cardId,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  // Typing indicators
  const emitTypingStart = (cardId, boardId) => {
    if (socket) {
      socket.emit("typing-start", {
        cardId,
        boardId,
        userId: user.id,
        userName: user.name,
      })
    }
  }

  const emitTypingStop = (cardId, boardId) => {
    if (socket) {
      socket.emit("typing-stop", {
        cardId,
        boardId,
        userId: user.id,
      })
    }
  }

  const value = {
    socket,
    connected,
    onlineUsers,
    joinBoard,
    leaveBoard,
    emitCardMoved,
    emitCardUpdated,
    emitCardCreated,
    emitCardDeleted,
    emitListCreated,
    emitListUpdated,
    emitListMoved,
    emitCommentAdded,
    emitTypingStart,
    emitTypingStop,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}
