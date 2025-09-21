import { useState, useEffect, useCallback } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Plus, Star, Users, Lock, Globe, ArrowLeft } from "lucide-react"
import Button from "../../components/UI/Button"
import LoadingSpinner from "../../components/UI/LoadingSpinner"
import CreateBoardModal from "../../components/Modals/CreateBoardModal"
import CreateWorkspaceModal from "../../components/Modals/CreateWorkspaceModal"

const Dashboard = () => {
  const [boards, setBoards] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false)
  
  const navigate = useNavigate()

  const getApiUrl = () => {
    const url = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
    console.log("Dashboard API URL:", url)
    return url
  }

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem("token")
      
      // Check if user is authenticated
      if (!token) {
        navigate("/login")
        return
      }
      
      const apiUrl = getApiUrl()
      console.log("Fetching dashboard data from:", apiUrl)

      const [boardsRes, workspacesRes] = await Promise.all([
        fetch(`${apiUrl}/api/boards`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }),
        fetch(`${apiUrl}/api/workspaces`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }),
      ])

      console.log("API Response status:", {
        boards: boardsRes.status,
        workspaces: workspacesRes.status,
      })

      if (!boardsRes.ok || !workspacesRes.ok) {
        // Handle authentication errors
        if (boardsRes.status === 401 || workspacesRes.status === 401) {
          localStorage.removeItem("token")
          navigate("/login")
          return
        }
        
        throw new Error(`Failed to fetch data: Boards ${boardsRes.status}, Workspaces ${workspacesRes.status}`)
      }

      const [boardsData, workspacesData] = await Promise.all([
        boardsRes.json(),
        workspacesRes.json(),
      ])

      console.log("Dashboard data loaded:", {
        boards: boardsData.length,
        workspaces: workspacesData.length,
      })

      setBoards(boardsData)
      setWorkspaces(workspacesData)
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setError(error.message)
      
      // If it's a network error, don't redirect to login
      if (error.message.includes("fetch")) {
        setError("Unable to connect to server. Please check your connection.")
      }
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Refresh data when component mounts (useful for back navigation)
  useEffect(() => {
    const handleFocus = () => {
      console.log("Dashboard focused - refreshing data")
      fetchData()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [fetchData])

  const handleBoardCreated = (newBoard) => {
    setBoards((prev) => [newBoard, ...prev])
    setShowCreateBoard(false)
  }

  const handleWorkspaceCreated = (newWorkspace) => {
    setWorkspaces((prev) => [newWorkspace, ...prev])
    setShowCreateWorkspace(false)
  }

  const handleRetry = () => {
    setError(null)
    fetchData()
  }

  if (loading) {
    return <LoadingSpinner text="Loading your boards..." />
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12 bg-white rounded-lg border border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeft size={24} className="text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-4">
            <Button onClick={handleRetry}>Try Again</Button>
            <Button 
              variant="outline" 
              onClick={() => navigate("/login")}
            >
              Login Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Boards</h1>
        <p className="text-gray-600">Manage your projects and collaborate with your team</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex flex-wrap gap-4">
        <Button onClick={() => setShowCreateBoard(true)}>
          <Plus size={16} className="mr-2" />
          Create Board
        </Button>
        <Button variant="outline" onClick={() => setShowCreateWorkspace(true)}>
          <Plus size={16} className="mr-2" />
          Create Workspace
        </Button>
        <Button variant="ghost" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {/* Workspaces Section */}
      {workspaces.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Workspaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <Link
                key={workspace._id}
                to={`/workspace/${workspace._id}`}
                className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {workspace.name}
                  </h3>
                  <Users size={16} className="text-gray-400 flex-shrink-0 ml-2" />
                </div>
                {workspace.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {workspace.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{workspace.boards?.length || 0} boards</span>
                  <span>{workspace.members?.length || 0} members</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Boards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Boards</h2>
        {boards.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No boards yet</h3>
            <p className="text-gray-600 mb-4">Create your first board to get started</p>
            <Button onClick={() => setShowCreateBoard(true)}>Create Board</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board) => (
              <Link key={board._id} to={`/board/${board._id}`} className="block group">
                <div
                  className="h-24 rounded-lg p-4 text-white relative overflow-hidden group-hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: board.background || "#0079bf" }}
                >
                  <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  <div className="relative z-10">
                    <h3 className="font-medium text-white truncate mb-1">{board.title}</h3>
                    <div className="flex items-center space-x-2 text-white text-opacity-80">
                      {board.visibility === "private" && <Lock size={12} />}
                      {board.visibility === "public" && <Globe size={12} />}
                      {board.starred?.includes("currentUserId") && <Star size={12} />}
                    </div>
                  </div>
                </div>
                <div className="mt-2 px-1">
                  <p className="text-sm text-gray-600 truncate">
                    {board.workspace?.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateBoard && (
        <CreateBoardModal
          workspaceId={workspaces[0]?._id}
          onClose={() => setShowCreateBoard(false)}
          onBoardCreated={handleBoardCreated}
        />
      )}

      {showCreateWorkspace && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateWorkspace(false)}
          onWorkspaceCreated={handleWorkspaceCreated}
        />
      )}
    </div>
  )
}

export default Dashboard