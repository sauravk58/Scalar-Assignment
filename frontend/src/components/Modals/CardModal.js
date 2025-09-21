import { useState, useEffect } from "react"
import Modal from "react-modal"
import { X, Calendar, User, Tag, MessageSquare, Clock, Trash2 } from "lucide-react"
import Button from "../UI/Button"
import LoadingSpinner from "../UI/LoadingSpinner"
import { useSocket } from "../../contexts/SocketContext"
import toast from "react-hot-toast"
import { format } from "date-fns"

const CardModal = ({ card, onClose, onCardUpdated, onCardDeleted }) => {
  const [cardData, setCardData] = useState(card)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  
  const { emitCommentAdded, emitCardUpdated } = useSocket()
  const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"

  useEffect(() => {
    if (card?._id) {
      fetchComments()
    }
  }, [card?._id])

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiUrl}/api/comments/card/${card._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
    } finally {
      setCommentsLoading(false)
    }
  }

  const handleCardUpdate = async (updates) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiUrl}/api/cards/${card._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedCard = await response.json()
        setCardData(updatedCard)
        onCardUpdated(updatedCard)
        emitCardUpdated(card._id, updates, card.board)
        toast.success("Card updated successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to update card")
      }
    } catch (error) {
      console.error("Error updating card:", error)
      toast.error("Failed to update card")
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiUrl}/api/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text: newComment,
          cardId: card._id,
        }),
      })

      if (response.ok) {
        const comment = await response.json()
        setComments([comment, ...comments])
        setNewComment("")
        emitCommentAdded(comment, card._id, card.board)
        toast.success("Comment added")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to add comment")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast.error("Failed to add comment")
    }
  }

  const handleDeleteCard = async () => {
    if (!window.confirm("Are you sure you want to delete this card?")) return

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${apiUrl}/api/cards/${card._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        onCardDeleted(card._id)
        toast.success("Card deleted successfully")
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to delete card")
      }
    } catch (error) {
      console.error("Error deleting card:", error)
      toast.error("Failed to delete card")
    } finally {
      setLoading(false)
    }
  }

  const handleTitleUpdate = () => {
    if (cardData.title !== card.title) {
      handleCardUpdate({ title: cardData.title })
    }
    setIsEditing(false)
  }

  const handleDescriptionUpdate = () => {
    if (cardData.description !== card.description) {
      handleCardUpdate({ description: cardData.description })
    }
    setEditingDescription(false)
  }

  const handleChecklistToggle = async (index) => {
    const updatedChecklist = [...(cardData.checklist || [])]
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      completed: !updatedChecklist[index].completed,
    }
    
    const updatedCard = { ...cardData, checklist: updatedChecklist }
    setCardData(updatedCard)
    await handleCardUpdate({ checklist: updatedChecklist })
  }

  if (!card) return null

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      className="max-w-4xl mx-auto mt-8 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={cardData.title}
                onChange={(e) => setCardData({ ...cardData, title: e.target.value })}
                onBlur={handleTitleUpdate}
                onKeyPress={(e) => e.key === "Enter" && handleTitleUpdate()}
                className="text-xl font-semibold w-full border-none outline-none bg-gray-50 p-2 rounded"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 p-2 rounded"
                onClick={() => setIsEditing(true)}
              >
                {cardData.title}
              </h2>
            )}
            <p className="text-sm text-gray-500 mt-1">
              in list <span className="font-medium">{card.listTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-4"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                {editingDescription ? (
                  <div>
                    <textarea
                      value={cardData.description || ""}
                      onChange={(e) => setCardData({ ...cardData, description: e.target.value })}
                      placeholder="Add a more detailed description..."
                      className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      autoFocus
                    />
                    <div className="mt-2 flex space-x-2">
                      <Button onClick={handleDescriptionUpdate} size="sm">
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCardData({ ...cardData, description: card.description })
                          setEditingDescription(false)
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingDescription(true)}
                    className="min-h-[100px] p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    {cardData.description ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{cardData.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">Add a more detailed description...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Checklist */}
              {cardData.checklist && cardData.checklist.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Checklist</h3>
                  <div className="space-y-2">
                    {cardData.checklist.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => handleChecklistToggle(index)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span
                          className={`flex-1 ${
                            item.completed
                              ? "line-through text-gray-500"
                              : "text-gray-700"
                          }`}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  <MessageSquare size={20} className="inline mr-2" />
                  Activity
                </h3>

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="mb-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button type="submit" disabled={!newComment.trim()}>
                      Comment
                    </Button>
                  </div>
                </form>

                {/* Comments List */}
                {commentsLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                            {comment.author?.avatar ? (
                              <img
                                src={comment.author.avatar}
                                alt={comment.author.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <User size={16} className="text-gray-600" />
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {comment.author?.name || "Unknown User"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Actions</h3>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Due Date
                </label>
                <input
                  type="datetime-local"
                  value={
                    cardData.dueDate
                      ? new Date(cardData.dueDate).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) => {
                    const dueDate = e.target.value ? new Date(e.target.value) : null
                    const updatedCard = { ...cardData, dueDate }
                    setCardData(updatedCard)
                    handleCardUpdate({ dueDate })
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User size={16} className="inline mr-1" />
                  Assignees
                </label>
                <div className="flex flex-wrap gap-1">
                  {cardData.assignees?.map((assignee) => (
                    <div
                      key={assignee._id}
                      className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1"
                    >
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        {assignee.avatar ? (
                          <img
                            src={assignee.avatar}
                            alt={assignee.name}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <User size={12} className="text-gray-600" />
                        )}
                      </div>
                      <span className="text-xs font-medium">{assignee.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Created/Updated Info */}
              <div className="pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center">
                    <Clock size={12} className="mr-1" />
                    Created {format(new Date(cardData.createdAt), "MMM d, yyyy")}
                  </div>
                  {cardData.updatedAt !== cardData.createdAt && (
                    <div className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      Updated {format(new Date(cardData.updatedAt), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              <div className="pt-4">
                <Button
                  onClick={handleDeleteCard}
                  variant="outline"
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                  disabled={loading}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default CardModal