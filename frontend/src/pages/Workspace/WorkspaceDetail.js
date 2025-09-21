"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import LoadingSpinner from "../../components/UI/LoadingSpinner"
import Button from "../../components/UI/Button"
import CreateBoardModal from "../../components/Modals/CreateBoardModal"

const WorkspaceDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [workspace, setWorkspace] = useState(null)
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showCreateBoard, setShowCreateBoard] = useState(false)

  useEffect(() => {
    fetchWorkspaceDetails()
  }, [id])

  const fetchWorkspaceDetails = async () => {
    try {
      const token = localStorage.getItem("token")

      // Fetch workspace details
      const workspaceResponse = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/workspaces/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!workspaceResponse.ok) {
        throw new Error("Failed to fetch workspace")
      }

      const workspaceData = await workspaceResponse.json()
      setWorkspace(workspaceData)

      // Fetch boards in this workspace
      const boardsResponse = await fetch(`${process.env.REACT_APP_BACKEND_API_URL}/api/boards?workspace=${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (boardsResponse.ok) {
        const boardsData = await boardsResponse.json()
        setBoards(boardsData)
      }

      setLoading(false)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleBoardCreated = (newBoard) => {
    setBoards([...boards, newBoard])
    setShowCreateBoard(false)
  }

  if (loading) return <LoadingSpinner />

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workspace?.name}</h1>
            <p className="text-gray-600 mt-2">{workspace?.description}</p>
          </div>
          <Button onClick={() => setShowCreateBoard(true)} className="bg-blue-600 hover:bg-blue-700">
            Create Board
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {boards.map((board) => (
          <div
            key={board._id}
            onClick={() => navigate(`/board/${board._id}`)}
            className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{board.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{board.description}</p>
            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  board.visibility === "private" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                }`}
              >
                {board.visibility}
              </span>
              <span className="text-gray-500 text-xs">{board.members?.length || 0} members</span>
            </div>
          </div>
        ))}

        {boards.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No boards</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new board.</p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateBoard(true)} className="bg-blue-600 hover:bg-blue-700">
                  Create Board
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateBoard && (
        <CreateBoardModal
          workspaceId={id}
          onClose={() => setShowCreateBoard(false)}
          onBoardCreated={handleBoardCreated}
        />
      )}
    </div>
  )
}

export default WorkspaceDetail
