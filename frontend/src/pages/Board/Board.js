"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams } from "react-router-dom"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import axios from "axios"
import { useSocket } from "../../contexts/SocketContext"
import { Plus } from "lucide-react"
import LoadingSpinner from "../../components/UI/LoadingSpinner"
import Button from "../../components/UI/Button"
import KanbanList from "../../components/Board/KanbanList"
import CardModal from "../../components/Modals/CardModal"
import CreateListModal from "../../components/Modals/CreateListModal"
import BoardHeader from "../../components/Board/BoardHeader"
import ActivitySidebar from "../../components/Board/ActivitySidebar"
import SearchFilters from "../../components/Board/SearchFilters"
import toast from "react-hot-toast"
import { useAuth } from "../../contexts/AuthContext"

const Board = () => {
  const { id: boardId } = useParams()
  const { user } = useAuth()
  const [board, setBoard] = useState(null)
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [showCreateList, setShowCreateList] = useState(false)
  const [showActivitySidebar, setShowActivitySidebar] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    labels: [],
    assignees: [],
    dueDate: "",
  })

  const { socket, joinBoard, leaveBoard, emitCardMoved, emitListMoved, onlineUsers } = useSocket()

  // Get API URL
  const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"

  // Memoize filtered and validated lists
  const validatedLists = useMemo(() => {
    return lists
      .filter(list => list && list._id && typeof list._id === 'string')
      .map(list => ({
        ...list,
        _id: String(list._id),
        cards: (list.cards || [])
          .filter(card => card && card._id && typeof card._id === 'string')
          .map(card => ({
            ...card,
            _id: String(card._id)
          }))
          .sort((a, b) => (a.position || 0) - (b.position || 0))
      }))
      .sort((a, b) => (a.position || 0) - (b.position || 0))
  }, [lists])

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("token")
      
      console.log("Fetching board:", boardId)
      console.log("API URL:", `${apiUrl}/api/boards/${boardId}`)
      
      const response = await axios.get(`${apiUrl}/api/boards/${boardId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log("Board response:", response.data)
      setBoard(response.data)

      // Validate and process lists
      const boardLists = response.data.lists || []
      const validLists = boardLists.filter(list => {
        if (!list || !list._id) {
          console.warn('Invalid list found:', list)
          return false
        }
        return true
      })

      // Sort lists by position and ensure cards are sorted
      const sortedLists = validLists
        .map(list => ({
          ...list,
          _id: String(list._id),
          cards: (list.cards || [])
            .filter(card => {
              if (!card || !card._id) {
                console.warn('Invalid card found:', card)
                return false
              }
              return true
            })
            .map(card => ({
              ...card,
              _id: String(card._id)
            }))
            .sort((a, b) => (a.position || 0) - (b.position || 0))
        }))
        .sort((a, b) => (a.position || 0) - (b.position || 0))

      console.log("Processing lists:", sortedLists.length)
      sortedLists.forEach((list, index) => {
        console.log(`List ${index}: ${list.title} (${list._id}) - ${list.cards?.length || 0} cards`)
      })

      setLists(sortedLists)
    } catch (error) {
      console.error("Error fetching board:", error)
      console.error("Error details:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        url: error.config?.url
      })
      
      if (error.response?.status === 404) {
        toast.error("Board not found")
      } else if (error.response?.status === 403) {
        toast.error("Access denied to this board")
      } else {
        toast.error("Failed to load board")
      }
    } finally {
      setLoading(false)
    }
  }, [boardId, apiUrl])

  useEffect(() => {
    if (boardId) {
      fetchBoard()
    }

    return () => {
      if (boardId) {
        leaveBoard(boardId)
      }
    }
  }, [boardId, fetchBoard, leaveBoard])

  const handleCardDeletedEvent = useCallback((cardId, listId) => {
    // if (data.userId === user?.id) return
  
    setLists(prevLists =>
      prevLists.map(list =>
        list._id === listId
          ? { ...list, cards: list.cards.filter(c => c._id !== cardId) }
          : list
      )
    )
  }, [])

  useEffect(() => {
    if (board && socket) {
      joinBoard(boardId)

      // Listen for real-time updates
      socket.on("card-moved", handleCardMovedEvent)
      socket.on("card-created", handleCardCreatedEvent)
      socket.on("card-updated", handleCardUpdatedEvent)
      socket.on("card-deleted", handleCardDeletedEvent)
      socket.on("list-created", handleListCreatedEvent)
      socket.on("list-updated", handleListUpdatedEvent)
      socket.on("list-moved", handleListMovedEvent)
      socket.on("comment-added", handleCommentAddedEvent)

      return () => {
        socket.off("card-moved", handleCardMovedEvent)
        socket.off("card-created", handleCardCreatedEvent)
        socket.off("card-updated", handleCardUpdatedEvent)
        socket.off("card-deleted", handleCardDeletedEvent)
        socket.off("list-created", handleListCreatedEvent)
        socket.off("list-updated", handleListUpdatedEvent)
        socket.off("list-moved", handleListMovedEvent)
        socket.off("comment-added", handleCommentAddedEvent)
      }
    }
  }, [board, socket, boardId, joinBoard])

  // Real-time event handlers
  const handleCardMovedEvent = useCallback((data) => {
    if (data.userId === socket?.id) return // Ignore own events

    setLists((prevLists) => {
      const newLists = [...prevLists]

      // Find source and destination lists
      const sourceListIndex = newLists.findIndex((list) => list.cards.some((card) => card._id === data.cardId))
      const destListIndex = newLists.findIndex((list) => list._id === data.toListId)

      if (sourceListIndex === -1 || destListIndex === -1) return prevLists

      // Remove card from source list
      const [movedCard] = newLists[sourceListIndex].cards.splice(
        newLists[sourceListIndex].cards.findIndex((card) => card._id === data.cardId),
        1,
      )

      // Update card's list reference
      movedCard.list = data.toListId
      movedCard.position = data.newPosition

      // Add card to destination list at correct position
      const insertIndex = newLists[destListIndex].cards.findIndex((card) => card.position > data.newPosition)

      if (insertIndex === -1) {
        newLists[destListIndex].cards.push(movedCard)
      } else {
        newLists[destListIndex].cards.splice(insertIndex, 0, movedCard)
      }

      return newLists
    })

    toast.success(`${data.userName} moved a card`)
  }, [socket])

  const handleCardCreatedEvent = useCallback((data) => {
    if (data.userId === socket?.id) return

    setLists((prevLists) => {
      const newLists = [...prevLists]
      const listIndex = newLists.findIndex((list) => list._id === data.card.list)

      if (listIndex !== -1) {
        const cardWithStringId = {
          ...data.card,
          _id: String(data.card._id)
        }
        newLists[listIndex].cards.push(cardWithStringId)
        newLists[listIndex].cards.sort((a, b) => (a.position || 0) - (b.position || 0))
      }

      return newLists
    })

    toast.success(`${data.userName} added a new card`)
  }, [socket])

  const handleCardUpdatedEvent = useCallback((data) => {
    if (data.userId === socket?.id) return

    setLists((prevLists) => {
      const newLists = [...prevLists]

      for (const list of newLists) {
        const cardIndex = list.cards.findIndex((card) => card._id === data.cardId)
        if (cardIndex !== -1) {
          list.cards[cardIndex] = { ...list.cards[cardIndex], ...data.updates }
          break
        }
      }

      return newLists
    })
  }, [socket])

  const handleListCreatedEvent = useCallback((data) => {
    if (data.userId === socket?.id) return

    setLists((prevLists) => {
      const exists = prevLists.some(l => String(l._id) === String(data.list._id))
  if (exists) return prevLists;
      const listWithStringId = {
        ...data.list,
        _id: String(data.list._id),
        cards: []
      }
      const newLists = [...prevLists, listWithStringId]
      return newLists.sort((a, b) => (a.position || 0) - (b.position || 0))
    })

    toast.success(`${data.userName} added a new list`)
  }, [socket])

  const handleListUpdatedEvent = useCallback((data) => {
    if (data.userId === socket?.id) return

    setLists((prevLists) => {
      const newLists = [...prevLists]
      const listIndex = newLists.findIndex((list) => list._id === data.listId)

      if (listIndex !== -1) {
        newLists[listIndex] = { ...newLists[listIndex], ...data.updates }
      }

      return newLists
    })
  }, [socket])

  const handleListMovedEvent = useCallback((data) => {
    if (data.userId === socket?.id) return

    setLists((prevLists) => {
      const newLists = [...prevLists]
      const listIndex = newLists.findIndex((list) => list._id === data.listId)

      if (listIndex !== -1) {
        newLists[listIndex].position = data.newPosition
        return newLists.sort((a, b) => (a.position || 0) - (b.position || 0))
      }

      return prevLists
    })
  }, [socket])

  const handleCommentAddedEvent = useCallback((data) => {
    if (data.userId === socket?.id) return

    // Update card if it's currently selected
    if (selectedCard && selectedCard._id === data.cardId) {
      setSelectedCard((prev) => ({
        ...prev,
        comments: [...(prev.comments || []), data.comment],
      }))
    }
  }, [socket, selectedCard])

  // Drag and drop handlers
  const onDragStart = useCallback(() => {
    setIsDragging(true)
  }, [])

  const onDragEnd = useCallback(async (result) => {
    setIsDragging(false)
    
    const { destination, source, draggableId, type } = result

    // Early return if no destination or same position
    if (!destination || 
        (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return
    }

    // Validate draggableId
    if (!draggableId || typeof draggableId !== 'string') {
      console.error('Invalid draggableId:', draggableId)
      return
    }

    // Validate that source and destination lists still exist
    const sourceExists = validatedLists.find(list => list._id === source.droppableId)
    const destExists = validatedLists.find(list => list._id === destination.droppableId)

    if (!sourceExists || !destExists) {
      console.error('Source or destination list not found:', {
        sourceId: source.droppableId,
        destId: destination.droppableId,
        sourceExists: !!sourceExists,
        destExists: !!destExists
      })
      toast.error('List not found. Refreshing board...')
      fetchBoard()
      return
    }

    if (type === "list") {
      // Handle list reordering
      const newLists = Array.from(validatedLists)
      const [reorderedList] = newLists.splice(source.index, 1)
      newLists.splice(destination.index, 0, reorderedList)

      // Calculate new position
      let newPosition
      if (destination.index === 0) {
        newPosition = newLists[1] ? newLists[1].position / 2 : 1024
      } else if (destination.index === newLists.length - 1) {
        newPosition = newLists[newLists.length - 2].position + 1024
      } else {
        const prevPosition = newLists[destination.index - 1].position
        const nextPosition = newLists[destination.index + 1].position
        newPosition = (prevPosition + nextPosition) / 2
      }

      reorderedList.position = newPosition
      setLists(newLists)

      // Emit real-time event
      emitListMoved(reorderedList._id, newPosition, boardId)

      // Update on server
      try {
        const token = localStorage.getItem("token")
        await axios.put(`${apiUrl}/api/lists/${reorderedList._id}/move`, 
          { position: newPosition },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      } catch (error) {
        console.error("Error moving list:", error)
        toast.error("Failed to move list")
        fetchBoard() // Refresh on error
      }

      return
    }

    // Handle card movement
    const sourceList = validatedLists.find((list) => list._id === source.droppableId)
    const destList = validatedLists.find((list) => list._id === destination.droppableId)

    if (!sourceList || !destList) {
      console.error('Source or destination list not found for card move')
      return
    }

    const sourceCards = Array.from(sourceList.cards)
    const cardToMove = sourceCards.find(card => card._id === draggableId)
    
    if (!cardToMove) {
      console.error('Card to move not found:', draggableId)
      return
    }

    const [movedCard] = sourceCards.splice(source.index, 1)

    if (source.droppableId === destination.droppableId) {
      // Moving within the same list
      sourceCards.splice(destination.index, 0, movedCard)

      // Calculate new position
      let newPosition
      if (destination.index === 0) {
        newPosition = sourceCards[1] ? sourceCards[1].position / 2 : 1024
      } else if (destination.index === sourceCards.length - 1) {
        newPosition = sourceCards[sourceCards.length - 2].position + 1024
      } else {
        const prevPosition = sourceCards[destination.index - 1].position
        const nextPosition = sourceCards[destination.index + 1].position
        newPosition = (prevPosition + nextPosition) / 2
      }

      movedCard.position = newPosition

      const newLists = lists.map((list) => {
        if (list._id === source.droppableId) {
          return { ...list, cards: sourceCards }
        }
        return list
      })

      setLists(newLists)

      // Emit real-time event
      emitCardMoved(movedCard._id, source.droppableId, destination.droppableId, newPosition, boardId)

      // Update on server
      try {
        const token = localStorage.getItem("token")
        await axios.put(`${apiUrl}/api/cards/${movedCard._id}/move`, 
          {
            listId: destination.droppableId,
            position: newPosition,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      } catch (error) {
        console.error("Error moving card:", error)
        toast.error("Failed to move card")
        fetchBoard() // Refresh on error
      }
    } else {
      // Moving to a different list
      const destCards = Array.from(destList.cards)

      // Calculate new position
      let newPosition
      if (destination.index === 0) {
        newPosition = destCards[0] ? destCards[0].position / 2 : 1024
      } else if (destination.index >= destCards.length) {
        newPosition = destCards[destCards.length - 1] ? destCards[destCards.length - 1].position + 1024 : 1024
      } else {
        const prevPosition = destCards[destination.index - 1] ? destCards[destination.index - 1].position : 0
        const nextPosition = destCards[destination.index].position
        newPosition = (prevPosition + nextPosition) / 2
      }

      movedCard.position = newPosition
      movedCard.list = destination.droppableId

      destCards.splice(destination.index, 0, movedCard)

      const newLists = lists.map((list) => {
        if (list._id === source.droppableId) {
          return { ...list, cards: sourceCards }
        }
        if (list._id === destination.droppableId) {
          return { ...list, cards: destCards }
        }
        return list
      })

      setLists(newLists)

      // Emit real-time event
      emitCardMoved(movedCard._id, source.droppableId, destination.droppableId, newPosition, boardId)

      // Update on server
      try {
        const token = localStorage.getItem("token")
        await axios.put(`${apiUrl}/api/cards/${movedCard._id}/move`, 
          {
            listId: destination.droppableId,
            position: newPosition,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
      } catch (error) {
        console.error("Error moving card:", error)
        toast.error("Failed to move card")
        fetchBoard() // Refresh on error
      }
    }
  }, [validatedLists, lists, emitListMoved, emitCardMoved, boardId, apiUrl, fetchBoard])

  const handleCardClick = useCallback((card) => {
    if (!isDragging) {
      setSelectedCard(card)
    }
  }, [isDragging])

  const handleCardCreated = useCallback((newCard) => {
    setLists((prevLists) => {
      const newLists = [...prevLists]
      const listIndex = newLists.findIndex((list) => list._id === newCard.list)

      if (listIndex !== -1) {
        const cardWithStringId = {
          ...newCard,
          _id: String(newCard._id)
        }
        newLists[listIndex].cards.push(cardWithStringId)
        newLists[listIndex].cards.sort((a, b) => (a.position || 0) - (b.position || 0))
      }

      return newLists
    })
  }, [])

  const handleListCreated = useCallback((newList) => {
    if (data.userId === user?.id) return
    setLists((prevLists) => {
      const exists = prevLists.some(l => String(l._id) === String(newList.list._id))
    if (exists) return prevLists
      const listWithStringId = {
        ...newList,
        _id: String(newList._id),
        cards: []
      }
      const newLists = [...prevLists, listWithStringId]
      return newLists.sort((a, b) => (a.position || 0) - (b.position || 0))
    })
    setShowCreateList(false)
  }, [])

  if (loading) {
    return <LoadingSpinner text="Loading board..." />
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Board not found</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Board Header */}
      <BoardHeader
        board={board}
        onlineUsers={onlineUsers}
        onShowActivity={() => setShowActivitySidebar(true)}
        onShowFilters={() => setShowFilters(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Search Filters */}
      {showFilters && (
        <SearchFilters
          board={board}
          filters={filters}
          onFiltersChange={setFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Board Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Board Area */}
        <div 
          className="flex-1 overflow-x-auto overflow-y-hidden p-4"
          style={{ backgroundColor: board.background || "#0079bf" }}
        >
          <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
            <Droppable 
              droppableId="board" 
              type="list" 
              direction="horizontal"
              isDropDisabled={false}
            >
              {(provided, snapshot) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef} 
                  className={`flex space-x-4 h-full min-w-max ${
                    snapshot.isDraggingOver ? 'bg-black bg-opacity-10' : ''
                  }`}
                >
                  {validatedLists.map((list, index) => (
                    <Draggable 
                      key={list._id} 
                      draggableId={list._id} 
                      index={index}
                      isDragDisabled={false}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`${snapshot.isDragging ? "transform rotate-2 shadow-2xl" : ""}`}
                        >
                          <KanbanList
                            list={list}
                            dragHandleProps={provided.dragHandleProps}
                            onCardClick={handleCardClick}
                            onCardCreated={handleCardCreated}
                            boardId={boardId}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {/* Add List Button */}
                  <div className="flex-shrink-0">
                    <Button
                      onClick={() => setShowCreateList(true)}
                      variant="ghost"
                      className="w-72 h-12 bg-white bg-opacity-20 text-white hover:bg-opacity-30 border-2 border-dashed border-white border-opacity-50"
                      disabled={isDragging}
                    >
                      <Plus size={16} className="mr-2" />
                      Add another list
                    </Button>
                  </div>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Activity Sidebar */}
        {showActivitySidebar && <ActivitySidebar boardId={boardId} onClose={() => setShowActivitySidebar(false)} />}
      </div>

      {/* Modals */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          isOpen={!!selectedCard}
          onClose={() => setSelectedCard(null)}
          boardId={boardId}
          onCardDeleted={handleCardDeletedEvent} 
        />
      )}

      <CreateListModal
        isOpen={showCreateList}
        onClose={() => setShowCreateList(false)}
        onListCreated={handleListCreated}
        boardId={boardId}
      />
    </div>
  )
}

export default Board