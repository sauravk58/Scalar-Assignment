  "use client"

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

    return user ? children : <Navigate to="/login" />
  }

  // Public Route component (redirect to dashboard if authenticated)
  const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth()

    if (loading) {
      return <LoadingSpinner />
    }

    return user ? <Navigate to="/dashboard" /> : children
  }

  // App Routes component (contains all routing logic)
  const AppRoutes = () => {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <SocketProvider>
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

              {/* Protected routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/board/:id"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Board />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/:id"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <WorkspaceDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Navbar />
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </SocketProvider>
        </div>
      </Router>
    )
  }

  // Main App component
  function App() {
    return (
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    )
  }

  export default App