import { createContext, useContext, useState, useEffect } from "react"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Set default API URL
const getApiUrl = () => {
  return process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const apiUrl = getApiUrl()
          console.log("Auth check API URL:", apiUrl)

          const response = await fetch(`${apiUrl}/api/auth/me`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
          } else {
            localStorage.removeItem("token")
            console.log("Auth check failed:", response.status)
          }
        } catch (error) {
          console.error("Auth check failed:", error)
          localStorage.removeItem("token")
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const apiUrl = getApiUrl()
      console.log("Login API URL:", apiUrl)

      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        const { token, user } = data
        localStorage.setItem("token", token)
        setUser(user)
        toast.success("Login successful!")
        return { success: true }
      } else {
        toast.error(data.message || "Login failed")
        return { success: false, error: data.message || "Login failed" }
      }
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Network error. Please try again.")
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const register = async (name, email, password) => {
    try {
      const apiUrl = getApiUrl()
      console.log("Register API URL:", apiUrl)

      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        const { token, user } = data
        localStorage.setItem("token", token)
        setUser(user)
        toast.success("Registration successful!")
        return { success: true }
      } else {
        toast.error(data.message || "Registration failed")
        return { success: false, error: data.message || "Registration failed" }
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Network error. Please try again.")
      return { success: false, error: "Network error. Please try again." }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    setUser(null)
    toast.success("Logged out successfully")
  }

  const updateUser = (userData) => {
    setUser((prev) => ({ ...prev, ...userData }))
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}