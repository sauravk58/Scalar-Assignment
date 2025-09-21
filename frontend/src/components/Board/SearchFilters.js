import { useState, useEffect } from "react"
import { Search, Filter, X, User, Tag, Calendar } from "lucide-react"
import Button from "../UI/Button"

const SearchFilters = ({ onFiltersChange, boardMembers = [], availableLabels = [] }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    assignees: [],
    labels: [],
    dueDate: "",
    hasDescription: false,
    hasComments: false,
  })

  useEffect(() => {
    onFiltersChange(filters)
  }, [filters, onFiltersChange])

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value })
  }

  const toggleAssignee = (userId) => {
    const newAssignees = filters.assignees.includes(userId)
      ? filters.assignees.filter((id) => id !== userId)
      : [...filters.assignees, userId]
    setFilters({ ...filters, assignees: newAssignees })
  }

  const toggleLabel = (labelId) => {
    const newLabels = filters.labels.includes(labelId)
      ? filters.labels.filter((id) => id !== labelId)
      : [...filters.labels, labelId]
    setFilters({ ...filters, labels: newLabels })
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      assignees: [],
      labels: [],
      dueDate: "",
      hasDescription: false,
      hasComments: false,
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.assignees.length > 0 ||
    filters.labels.length > 0 ||
    filters.dueDate ||
    filters.hasDescription ||
    filters.hasComments

  return (
    <div className="relative bg-white border-b border-gray-200 p-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search cards..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 ${
            hasActiveFilters ? "bg-blue-50 border-blue-300" : ""
          }`}
        >
          <Filter size={16} />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {[
                filters.assignees.length,
                filters.labels.length,
                filters.dueDate ? 1 : 0,
                filters.hasDescription ? 1 : 0,
                filters.hasComments ? 1 : 0,
              ].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.assignees.map((userId) => {
            const member = boardMembers.find((m) => m._id === userId)
            return (
              <span
                key={userId}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                <User size={12} className="mr-1" />
                {member?.name || "Unknown"}
                <button
                  onClick={() => toggleAssignee(userId)}
                  className="ml-1 hover:text-blue-600"
                >
                  <X size={12} />
                </button>
              </span>
            )
          })}
          
          {filters.labels.map((labelId) => {
            const label = availableLabels.find((l) => l._id === labelId)
            return (
              <span
                key={labelId}
                className="inline-flex items-center px-2 py-1 text-xs rounded-full text-white"
                style={{ backgroundColor: label?.color || "#gray" }}
              >
                <Tag size={12} className="mr-1" />
                {label?.name || "Unknown"}
                <button
                  onClick={() => toggleLabel(labelId)}
                  className="ml-1 hover:opacity-80"
                >
                  <X size={12} />
                </button>
              </span>
            )
          })}
          
          {filters.dueDate && (
            <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
              <Calendar size={12} className="mr-1" />
              {filters.dueDate}
              <button
                onClick={() => setFilters({ ...filters, dueDate: "" })}
                className="ml-1 hover:text-orange-600"
              >
                <X size={12} />
              </button>
            </span>
          )}
          
          <button
            onClick={clearFilters}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
          <div className="space-y-4">
            {/* Assignees */}
            {boardMembers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Assignees</h4>
                <div className="space-y-1">
                  {boardMembers.map((member) => (
                    <label key={member._id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.assignees.includes(member._id)}
                        onChange={() => toggleAssignee(member._id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <User size={12} className="text-gray-600" />
                        </div>
                        <span className="text-sm text-gray-700">{member.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Due Date */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Due Date</h4>
              <div className="space-y-1">
                {[
                  { value: "overdue", label: "Overdue" },
                  { value: "today", label: "Due today" },
                  { value: "week", label: "Due this week" },
                  { value: "month", label: "Due this month" },
                ].map((option) => (
                  <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dueDate"
                      value={option.value}
                      checked={filters.dueDate === option.value}
                      onChange={(e) => setFilters({ ...filters, dueDate: e.target.value })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Other Filters */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Other</h4>
              <div className="space-y-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasDescription}
                    onChange={(e) => setFilters({ ...filters, hasDescription: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Has description</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.hasComments}
                    onChange={(e) => setFilters({ ...filters, hasComments: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Has comments</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
            <Button onClick={() => setIsOpen(false)} size="sm">
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchFilters