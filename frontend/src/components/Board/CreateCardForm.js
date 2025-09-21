"use client"

import { useState } from "react"
import { X } from "lucide-react"
import axios from "axios"
import Button from "../UI/Button"
import { useSocket } from "../../contexts/SocketContext"
import toast from "react-hot-toast"

const CreateCardForm = ({ listId, boardId, onCardCreated, onCancel }) => {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const { emitCardCreated } = useSocket()

  // Get API URL
  const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) return

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      
      console.log("Creating card:", {
        title: title.trim(),
        listId,
        boardId,
        apiUrl: `${apiUrl}/api/cards`
      })

      const response = await axios.post(`${apiUrl}/api/cards`, {
        title: title.trim(),
        listId,
        boardId,
      }, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      })

      const newCard = response.data

      // Emit real-time event
      emitCardCreated(newCard, boardId)

      onCardCreated(newCard)
      setTitle("")
      toast.success("Card created successfully")
    } catch (error) {
      console.error("Error creating card:", error)
      console.error("Error details:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      })
      
      if (error.response?.status === 404) {
        toast.error("API endpoint not found. Check your server.")
      } else if (error.response?.status === 401) {
        toast.error("Unauthorized. Please log in again.")
      } else if (error.response?.status === 403) {
        toast.error("Access denied.")
      } else {
        toast.error("Failed to create card")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter a title for this card..."
        className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        rows={3}
        autoFocus
      />

      <div className="flex items-center space-x-2">
        <Button type="submit" size="small" loading={loading} disabled={!title.trim()}>
          Add card
        </Button>

        <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600 rounded">
          <X size={16} />
        </button>
      </div>
    </form>
  )
}

export default CreateCardForm