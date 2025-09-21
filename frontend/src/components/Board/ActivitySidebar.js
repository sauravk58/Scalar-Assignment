import { useState, useEffect } from "react"
import { X, Clock, MessageSquare, Move, Plus, Edit } from "lucide-react"
import LoadingSpinner from "../UI/LoadingSpinner"
import { format, formatDistanceToNow } from "date-fns"

const ActivitySidebar = ({ boardId, isOpen, onClose }) => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    if (isOpen && boardId) {
      fetchActivities()
    }
  }, [isOpen, boardId, filter])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
      
      const response = await fetch(
        `${apiUrl}/api/activities/board/${boardId}?filter=${filter}&limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        console.error("Failed to fetch activities:", response.status)
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case "comment_added":
        return <MessageSquare size={16} className="text-blue-500" />
      case "card_moved":
        return <Move size={16} className="text-green-500" />
      case "card_created":
        return <Plus size={16} className="text-purple-500" />
      case "card_updated":
        return <Edit size={16} className="text-orange-500" />
      default:
        return <Clock size={16} className="text-gray-500" />
    }
  }

  const getActivityDescription = (activity) => {
    const userName = activity.actor?.name || "Unknown User"
    
    switch (activity.type) {
      case "comment_added":
        return (
          <div>
            <span className="font-medium">{userName}</span> commented on{" "}
            <span className="font-medium">{activity.card?.title}</span>
          </div>
        )
      case "card_moved":
        return (
          <div>
            <span className="font-medium">{userName}</span> moved{" "}
            <span className="font-medium">{activity.card?.title}</span>
          </div>
        )
      case "card_created":
        return (
          <div>
            <span className="font-medium">{userName}</span> created{" "}
            <span className="font-medium">{activity.card?.title}</span>
          </div>
        )
      case "card_updated":
        return (
          <div>
            <span className="font-medium">{userName}</span> updated{" "}
            <span className="font-medium">{activity.card?.title}</span>
          </div>
        )
      case "list_created":
        return (
          <div>
            <span className="font-medium">{userName}</span> created list{" "}
            <span className="font-medium">{activity.list?.title}</span>
          </div>
        )
      default:
        return activity.description || `${userName} performed an action`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex space-x-2">
          {[
            { key: "all", label: "All" },
            { key: "comments", label: "Comments" },
            { key: "moves", label: "Moves" },
            { key: "cards", label: "Cards" },
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                filter === filterOption.key
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        ) : activities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Clock size={48} className="mx-auto mb-2 text-gray-300" />
            <p>No activity yet</p>
            <p className="text-sm">Activity will appear here as you work on this board</p>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {activities.map((activity) => (
              <div key={activity._id} className="flex space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">
                    {getActivityDescription(activity)}
                  </div>
                  <div className="flex items-center mt-1 text-xs text-gray-500">
                    <Clock size={12} className="mr-1" />
                    <span title={format(new Date(activity.createdAt), "PPpp")}>
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Showing recent activity for this board
        </p>
      </div>
    </div>
  )
}

export default ActivitySidebar