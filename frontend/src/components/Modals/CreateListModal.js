"use client"

import { useState } from "react"
import Modal from "react-modal"
import { X } from "lucide-react"
import axios from "axios"
import Button from "../UI/Button"
import { useSocket } from "../../contexts/SocketContext"
import toast from "react-hot-toast"

const CreateListModal = ({ isOpen, onClose, onListCreated, boardId }) => {
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const { emitListCreated } = useSocket()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("List title is required")
      return
    }

    setLoading(true)

    try {
      const response = await axios.post("/lists", {
        title: title.trim(),
        boardId,
      })

      const newList = response.data

      // Emit real-time event
      emitListCreated(newList, boardId)

      onListCreated(newList)
      toast.success("List created successfully")

      // Reset form
      setTitle("")
    } catch (error) {
      console.error("Error creating list:", error)
      toast.error(error.response?.data?.message || "Failed to create list")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="max-w-md mx-auto mt-20 bg-white rounded-lg shadow-xl"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Add List</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              List title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. To Do"
              required
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Add List
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CreateListModal
