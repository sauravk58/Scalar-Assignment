"use client"

import { useState } from "react"
import Modal from "react-modal"
import { X } from "lucide-react"
import Button from "../UI/Button"
import toast from "react-hot-toast"

const CreateWorkspaceModal = ({ onClose, onWorkspaceCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("Workspace name is required")
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
      
      const response = await fetch(`${apiUrl}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        onWorkspaceCreated(data)
        toast.success("Workspace created successfully")

        // Reset form
        setFormData({
          name: "",
          description: "",
        })
      } else {
        toast.error(data.message || "Failed to create workspace")
      }
    } catch (error) {
      console.error("Error creating workspace:", error)
      toast.error("Failed to create workspace")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      className="max-w-md mx-auto mt-20 bg-white rounded-lg shadow-xl"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Workspace</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Workspace name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. My Company"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="What's this workspace for?"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Workspace
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CreateWorkspaceModal
