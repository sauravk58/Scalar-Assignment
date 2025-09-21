"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import Button from "../UI/Button"
import toast from "react-hot-toast"
import Modal from "react-modal"

const CreateBoardModal = ({ workspaceId, onClose, onBoardCreated }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    workspaceId: workspaceId || "", // Make sure this is properly initialized
    visibility: "workspace",
    background: "#0079bf",
  })
  const [loading, setLoading] = useState(false)
  const [workspaces, setWorkspaces] = useState([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)

  // Fetch workspaces if no workspaceId is provided
  useEffect(() => {
    if (!workspaceId) {
      fetchWorkspaces()
    }
  }, [workspaceId])

  const fetchWorkspaces = async () => {
    setLoadingWorkspaces(true)
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
      
      const response = await fetch(`${apiUrl}/api/workspaces`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        
        // If no workspaces exist, create a default one
        if (data.length === 0) {
          await createDefaultWorkspace()
        } else {
          setWorkspaces(data)
          
          // Auto-select first workspace if available
          if (data.length > 0 && !formData.workspaceId) {
            setFormData(prev => ({
              ...prev,
              workspaceId: data[0]._id
            }))
          }
        }
      } else {
        console.error("Failed to fetch workspaces")
        toast.error("Failed to load workspaces")
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error)
      toast.error("Error loading workspaces")
    } finally {
      setLoadingWorkspaces(false)
    }
  }

  const createDefaultWorkspace = async () => {
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
      
      const response = await fetch(`${apiUrl}/api/workspaces`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "My Workspace",
          description: "Default workspace"
        })
      })

      if (response.ok) {
        const newWorkspace = await response.json()
        setWorkspaces([newWorkspace])
        setFormData(prev => ({
          ...prev,
          workspaceId: newWorkspace._id
        }))
        toast.success("Created default workspace")
      } else {
        throw new Error("Failed to create default workspace")
      }
    } catch (error) {
      console.error("Error creating default workspace:", error)
      toast.error("Please create a workspace first")
    }
  }
  // const [workspaces, setWorkspaces] = useState([])
  // const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)

  const backgroundColors = [
    "#0079bf",
    "#d29034",
    "#519839",
    "#b04632",
    "#89609e",
    "#cd5a91",
    "#4bbf6b",
    "#00aecc",
    "#838c91",
    "#172b4d",
  ]

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.title.trim()) {
      toast.error("Board title is required")
      return
    }

    if (formData.title.trim().length < 2) {
      toast.error("Board title must be at least 2 characters long")
      return
    }

    if (formData.title.trim().length > 100) {
      toast.error("Board title must be less than 100 characters")
      return
    }

    // Check if workspaceId is provided - this is the main issue
    const finalWorkspaceId = workspaceId || formData.workspaceId
    if (!finalWorkspaceId) {
      console.error("[v0] Missing workspace ID:", { 
        propWorkspaceId: workspaceId, 
        formWorkspaceId: formData.workspaceId 
      })
      toast.error("Workspace ID is required. Please select a workspace.")
      return
    }

    // Validate workspace ID format (MongoDB ObjectId is 24 hex characters)
    const mongoIdRegex = /^[0-9a-fA-F]{24}$/
    if (!mongoIdRegex.test(finalWorkspaceId)) {
      console.error("[v0] Invalid workspace ID format:", finalWorkspaceId)
      toast.error("Invalid workspace ID format. Please select a valid workspace.")
      return
    }

    // Check if token exists
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication token is missing. Please log in again.")
      return
    }

    setLoading(true)

    try {
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
      
      // Debug environment variable
      console.log("Environment API URL:", process.env.REACT_APP_BACKEND_API_URL)
      console.log("Using API URL:", apiUrl)
      
      // Ensure workspaceId is set correctly
      const requestData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        workspaceId: finalWorkspaceId,  // Make sure this is set
        visibility: formData.visibility,
        background: formData.background,
      }

      console.group("[v0] Board Creation Request")
      console.log("API URL:", `${apiUrl}/api/boards`)
      console.log("Request Data:", requestData)
      console.log("Workspace ID from props:", workspaceId)
      console.log("Workspace ID from form:", formData.workspaceId)
      console.log("Final Workspace ID:", finalWorkspaceId)
      console.log("Has Token:", !!token)
      console.groupEnd()

      const response = await fetch(`${apiUrl}/api/boards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      })

      console.log("[v0] Response status:", response.status)

      const responseText = await response.text()
      console.log("[v0] Raw response:", responseText)

      let data = null
      
      // Try to parse JSON response
      if (responseText) {
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error("[v0] JSON parse error:", parseError)
          console.error("[v0] Response was:", responseText)
          // If JSON parsing fails, create a basic error object
          data = { 
            message: "Server returned invalid response", 
            error: responseText 
          }
        }
      } else {
        // If no response text, create a basic error object
        data = { 
          message: "No response from server" 
        }
      }

      if (response.ok) {
        // Success case
        if (data && typeof data === 'object') {
          onBoardCreated(data)
          toast.success("Board created successfully")
          // Reset form
          setFormData({
            title: "",
            description: "",
            workspaceId: workspaceId || "",
            visibility: "workspace",
            background: "#0079bf",
          })
        } else {
          console.error("[v0] Invalid success response:", data)
          toast.error("Board created but received invalid response")
        }
      } else {
        // Error case
        console.group("[v0] Server Error Details")
        console.error("Status:", response.status)
        console.error("Status Text:", response.statusText)
        console.error("Response Data:", data)
        console.error("Request Data:", formData)
        console.error("Headers:", {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") ? "***" : "MISSING"}`,
        })
        console.groupEnd()
        
        // Extract error message with more detail
        let errorMessage = "Failed to create board"
        
        if (data?.message) {
          errorMessage = data.message
        } else if (data?.error) {
          errorMessage = data.error
        } else if (data?.errors && Array.isArray(data.errors)) {
          // Handle validation errors array
          errorMessage = data.errors.map(err => err.message || err).join(", ")
        } else if (response.status === 400) {
          errorMessage = "Bad Request - Please check your input data"
        } else if (response.status === 401) {
          errorMessage = "Unauthorized - Please log in again"
        } else if (response.status === 403) {
          errorMessage = "Forbidden - You don't have permission to create boards"
        } else if (response.status === 422) {
          errorMessage = "Validation Error - Please check your input"
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}`
        }
        
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("[v0] Network/Request error:", error)
      
      // Handle different types of errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast.error("Network error: Unable to connect to server")
      } else if (error.message) {
        toast.error(error.message)
      } else {
        toast.error("An unexpected error occurred")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      appElement={document.getElementById('root') || document.body}
      className="max-w-md mx-auto mt-20 bg-white rounded-lg shadow-xl"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Create Board</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Board Preview */}
          <div
            className="h-24 rounded-lg p-4 text-white relative overflow-hidden"
            style={{ backgroundColor: formData.background }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
            <div className="relative z-10">
              <h3 className="font-medium text-white">{formData.title || "Board Title"}</h3>
            </div>
          </div>

          {/* Background Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
            <div className="grid grid-cols-5 gap-2">
              {backgroundColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, background: color })}
                  className={`w-12 h-8 rounded border-2 ${
                    formData.background === color ? "border-gray-800" : "border-gray-300"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Board title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g. My Project Board"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="What's this board about?"
            />
          </div>

          {/* Workspace ID (if not provided as prop) */}
          {!workspaceId && (
            <div>
              <label htmlFor="workspaceId" className="block text-sm font-medium text-gray-700 mb-1">
                Workspace ID *
              </label>
              <input
                type="text"
                id="workspaceId"
                name="workspaceId"
                value={formData.workspaceId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter workspace ID"
                required
              />
            </div>
          )}

          {/* Visibility */}
          <div>
            <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-1">
              Visibility
            </label>
            <select
              id="visibility"
              name="visibility"
              value={formData.visibility}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="private">Private</option>
              <option value="workspace">Workspace</option>
              <option value="public">Public</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Board
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default CreateBoardModal