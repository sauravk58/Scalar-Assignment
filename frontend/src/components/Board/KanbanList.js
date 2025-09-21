"use client"

import { useState, useEffect } from "react"
import { Droppable, Draggable } from "react-beautiful-dnd"
import { Plus, MoreHorizontal, GripVertical } from "lucide-react"
import Button from "../UI/Button"
import KanbanCard from "./KanbanCard"
import CreateCardForm from "./CreateCardForm"

const KanbanList = ({ list, dragHandleProps, onCardClick, onCardCreated, boardId }) => {
  const [showCreateCard, setShowCreateCard] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false)
    if (showMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showMenu])

  const handleCardCreated = (newCard) => {
    onCardCreated(newCard)
    setShowCreateCard(false)
  }

  // Remove duplicate cards and ensure unique keys with better validation
  const uniqueCards = list.cards ? 
    list.cards
      .filter(card => card && card._id) // Ensure card and _id exist
      .filter((card, index, arr) => 
        arr.findIndex(c => c._id === card._id) === index
      )
      .map(card => ({
        ...card,
        // Ensure _id is a string for react-beautiful-dnd
        _id: String(card._id)
      })) : []

  // Add a key to force re-render when cards change significantly
  const listKey = `${list._id}-${uniqueCards.length}-${uniqueCards.map(c => c._id).join('-')}`

  return (
    <div className="w-72 bg-gray-100 rounded-lg flex flex-col max-h-full">
      {/* List Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical size={16} className="text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 truncate flex-1">{list.title}</h3>
            <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded">
              {uniqueCards.length}
            </span>
          </div>

          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }} 
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <MoreHorizontal size={16} />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                <button 
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCreateCard(true)
                    setShowMenu(false)
                  }}
                >
                  Add card...
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Copy list...
                </button>
                <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Move list...
                </button>
                <hr className="my-1" />
                <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                  Archive this list
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards Container */}
      <Droppable 
        droppableId={String(list._id)} 
        type="card"
        isDropDisabled={false}
        key={listKey} // Force re-render when cards change significantly
      >
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`flex-1 p-2 space-y-2 overflow-y-auto min-h-0 ${
              snapshot.isDraggingOver ? "bg-blue-50" : ""
            }`}
          >
            {uniqueCards.map((card, index) => {
              // Additional validation
              if (!card || !card._id) {
                console.warn('Invalid card:', card)
                return null
              }

              const cardId = String(card._id)

              return (
                <Draggable 
                  key={cardId} 
                  draggableId={cardId} 
                  index={index}
                  isDragDisabled={false}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`${snapshot.isDragging ? "transform rotate-2 shadow-lg" : ""}`}
                    >
                      <KanbanCard 
                        card={card} 
                        onClick={() => onCardClick(card)} 
                        isDragging={snapshot.isDragging} 
                      />
                    </div>
                  )}
                </Draggable>
              )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add Card Section */}
      <div className="p-2">
        {showCreateCard ? (
          <CreateCardForm
            listId={list._id}
            boardId={boardId}
            onCardCreated={handleCardCreated}
            onCancel={() => setShowCreateCard(false)}
          />
        ) : (
          <Button
            onClick={() => setShowCreateCard(true)}
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:bg-gray-200"
          >
            <Plus size={16} className="mr-2" />
            Add a card
          </Button>
        )}
      </div>
    </div>
  )
}

export default KanbanList