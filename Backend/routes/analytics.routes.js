const express = require("express")
const router = express.Router()
// Make sure the path to the controller is correct
const { getProgressAnalytics } = require("../controllers/analytics")


// Check that getProgressAnalytics is properly imported
router.get("/progress",  getProgressAnalytics)

module.exports = router
