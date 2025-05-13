const express = require("express")
const router = express.Router()

// Import all route files
const authRoutes = require("./auth.routes")
const chatbotRoutes = require("./chatbot.routes")
const labRoutes = require("./lab.routes")
const messagesRoutes = require("./Messages.routes")
const analyticsRoutes = require("./analytics.routes") // Make sure this path is correct

// Mount routes with their respective prefixes
router.use("/api/user", authRoutes)
router.use("/api/user", chatbotRoutes)
router.use("/api/user", labRoutes)
router.use("/api/messages", messagesRoutes)
router.use("/api/analytics", analyticsRoutes)

module.exports = router
