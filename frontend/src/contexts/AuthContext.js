"use client"

import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

axios.defaults.baseURL = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Set up axios interceptor for auth token
  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    // Response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout()
          toast.error("Session expired. Please login again.")
        }
        return Promise.reject(error)
      },
    )

    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token")
      if (token) {
        try {
          const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
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
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
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
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
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
      const apiUrl = process.env.REACT_APP_BACKEND_API_URL || "http://localhost:4000"
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
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
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
    delete axios.defaults.headers.common["Authorization"]
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
