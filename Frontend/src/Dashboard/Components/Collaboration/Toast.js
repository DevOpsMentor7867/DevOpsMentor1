"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

export const Toast = ({ message, sender, onClose }) => {
  useEffect(() => {
    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      onClose()
    }, 3000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed top-6 right-6 z-50 animate-slide-in">
      <div className="bg-[#1A202C] border border-[#09D1C7]/20 text-white rounded-lg shadow-lg p-4 max-w-xs">
        <div className="flex justify-between items-start mb-1">
          <div className="font-medium text-[#09D1C7]">{sender}</div>
          <button onClick={onClose} className="text-white/60 hover:text-white text-sm">
            ✕
          </button>
        </div>
        <p className="text-sm text-white/90">{message}</p>
      </div>
    </div>
  )
}

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([])
  const [portalElement, setPortalElement] = useState(null)
  const toastIdRef = useRef(0)

  useEffect(() => {
    // Create portal element for toasts
    setPortalElement(document.body)
  }, [])

  // Function to add a new toast
  // eslint-disable-next-line
  const showToast = (message, sender) => {
    const id = toastIdRef.current++
    setToasts((prev) => [...prev, { id, message, sender }])
    return id
  }

  // Function to remove a toast
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  if (!portalElement) return null

  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} sender={toast.sender} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    portalElement,
  )
}

// Custom hook to use the toast system
export const useToast = () => {
  const [showToast] = useState(() => (message, sender) => {
    const container = document.getElementById("toast-portal")
    if (!container) {
      console.error("Toast container not found. Ensure ToastContainer is rendered.")
      return
    }

    const root = document.createElement("div")
    root.id = "toast-root"
    container.appendChild(root)

    const toast = ToastContainer()
    return toast.showToast(message, sender)
  })

  return {
    showToast,
  }
}
