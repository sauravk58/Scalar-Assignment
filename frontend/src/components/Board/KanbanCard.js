"use client"
import { Calendar, MessageCircle, Paperclip, CheckSquare } from "lucide-react"
import { format, isToday, isPast } from "date-fns"

const KanbanCard = ({ card, onClick, isDragging }) => {
  const getDueDateColor = () => {
    if (!card.dueDate) return ""

    const dueDate = new Date(card.dueDate)
    if (card.completed) return "text-green-600 bg-green-100"
    if (isPast(dueDate) && !isToday(dueDate)) return "text-red-600 bg-red-100"
    if (isToday(dueDate)) return "text-yellow-600 bg-yellow-100"
    return "text-gray-600 bg-gray-100"
  }

  const getChecklistProgress = () => {
    if (!card.checklist || card.checklist.length === 0) return null

    const completed = card.checklist.filter((item) => item.completed).length
    const total = card.checklist.length
    const percentage = (completed / total) * 100

    return { completed, total, percentage }
  }

  const checklistProgress = getChecklistProgress()

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-3 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? "shadow-lg" : ""
      }`}
    >
      {/* Card Title */}
      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-3">{card.title}</h4>

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.slice(0, 3).map((label, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 text-xs font-medium text-white rounded"
              style={{ backgroundColor: label.color || "#64748b" }}
            >
              {label.name}
            </span>
          ))}
          {card.labels.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded">
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Due Date */}
      {card.dueDate && (
        <div
          className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium mb-2 ${getDueDateColor()}`}
        >
          <Calendar size={12} />
          <span>{isToday(new Date(card.dueDate)) ? "Today" : format(new Date(card.dueDate), "MMM d")}</span>
        </div>
      )}

      {/* Checklist Progress */}
      {checklistProgress && (
        <div className="mb-2">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <CheckSquare size={12} />
            <span>
              {checklistProgress.completed}/{checklistProgress.total}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div
                className={`h-1 rounded-full ${checklistProgress.percentage === 100 ? "bg-green-500" : "bg-blue-500"}`}
                style={{ width: `${checklistProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Comments */}
          {card.comments && card.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle size={12} />
              <span>{card.comments.length}</span>
            </div>
          )}

          {/* Attachments */}
          {card.attachments && card.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip size={12} />
              <span>{card.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assignees */}
        {card.assignees && card.assignees.length > 0 && (
          <div className="flex -space-x-1">
            {card.assignees.slice(0, 3).map((assignee, index) => (
              <div
                key={assignee._id || index}
                className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-700 border-2 border-white"
                title={assignee.name}
              >
                {assignee.avatar ? (
                  <img
                    src={assignee.avatar || "/placeholder.svg"}
                    alt={assignee.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  assignee.name?.charAt(0)?.toUpperCase()
                )}
              </div>
            ))}
            {card.assignees.length > 3 && (
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-white">
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default KanbanCard
