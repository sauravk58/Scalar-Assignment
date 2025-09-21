import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import Navbar from "./components/Layout/Navbar"
import Login from "./pages/Auth/Login"
import Register from "./pages/Auth/Register"
import Dashboard from "./pages/Dashboard/Dashboard"
import Board from "./pages/Board/Board"
import WorkspaceDetail from "./pages/Workspace/WorkspaceDetail"
import Profile from "./pages/Profile/Profile"
import LoadingSpinner from "./components/UI/LoadingSpinner"
import { SocketProvider } from "./contexts/SocketContext"
import { Toaster } from 'react-hot-toast'


// Protected Route component

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// App Routes component (contains all routing logic)
const AppRoutes = () => {
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected routes with SocketProvider only for authenticated users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <Navbar />
                  <Dashboard />
                </SocketProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/board/:id"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <Navbar />
                  <Board />
                </SocketProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <Navbar />
                  <WorkspaceDetail />
                </SocketProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <SocketProvider>
                  <Navbar />
                  <Profile />
                </SocketProvider>
              </ProtectedRoute>
            }
          />

          {/* Default redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  )
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App