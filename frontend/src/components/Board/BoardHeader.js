"use client"
import { Star, Filter, Activity, Search, MoreHorizontal } from "lucide-react"
import Button from "../UI/Button"

const BoardHeader = ({ board, onlineUsers, onShowActivity, onShowFilters, searchQuery, onSearchChange }) => {
  return (
    <div className="bg-black bg-opacity-20 text-white p-4">
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">{board.title}</h1>

          <button className="p-1 hover:bg-white hover:bg-opacity-20 rounded">
            <Star size={16} />
          </button>

          <div className="text-sm opacity-80">{board.workspace?.name}</div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-white text-opacity-60" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search cards..."
              className="block w-full pl-10 pr-3 py-2 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-md leading-5 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:bg-opacity-30 focus:border-opacity-50 text-sm"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Online users */}
          <div className="flex -space-x-1">
            {board.members?.slice(0, 5).map((member) => (
              <div
                key={member.user._id}
                className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-medium border-2 border-white border-opacity-30"
                title={member.user.name}
              >
                {member.user.avatar ? (
                  <img
                    src={member.user.avatar || "/placeholder.svg"}
                    alt={member.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  member.user.name?.charAt(0)?.toUpperCase()
                )}
              </div>
            ))}
            {board.members?.length > 5 && (
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-sm font-medium border-2 border-white border-opacity-30">
                +{board.members.length - 5}
              </div>
            )}
          </div>

          <Button
            onClick={onShowFilters}
            variant="ghost"
            size="small"
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Filter size={16} className="mr-1" />
            Filter
          </Button>

          <Button
            onClick={onShowActivity}
            variant="ghost"
            size="small"
            className="text-white hover:bg-white hover:bg-opacity-20"
          >
            <Activity size={16} className="mr-1" />
            Activity
          </Button>

          <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default BoardHeader
