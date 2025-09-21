import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"
import { AuthProvider } from "./contexts/AuthContext"
import { Toaster } from "react-hot-toast"
import Modal from "react-modal"


// Set the app element for react-modal accessibility
Modal.setAppElement("#root")

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
    </AuthProvider>
  </React.StrictMode>,
)
