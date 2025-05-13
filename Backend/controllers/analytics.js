const UserProgress = require("../models/userProgress")
const Tool = require("../models/toolsModel")
const Lab = require("../models/labModel")

exports.getProgressAnalytics = async (req, res) => {
  try {
    // Extract userId from query if auth is skipped
    const userId = req.query.userId;

    // Get user progress with error handling
    const userProgress = await UserProgress.findOne({ user_id: userId })
    if (!userProgress) {
      return res.status(404).json({ message: "No progress found for this user" })
    }

    // Get all tools
    const tools = await Tool.find()

    // Calculate tools progress - using your existing model structure
    const toolsProgress = tools.map((tool) => {
      const toolProgress = userProgress.getToolProgress(tool._id)
      return {
        name: tool.name || toolProgress?.tool_name || `Tool ${tool._id}`,
        progress: toolProgress ? toolProgress.completion_percentage : 0,
        labsCompleted: toolProgress ? toolProgress.labs.filter((lab) => lab.status === "completed").length : 0,
        totalLabs: toolProgress ? toolProgress.labs.length : 0,
      }
    })

    // Get detailed lab progress for each tool
    const labsProgress = await Promise.all(
      tools.map(async (tool) => {
        const toolProgress = userProgress.getToolProgress(tool._id)
        if (!toolProgress) return null

        const labs = await Lab.find({ tool_id: tool._id })
        return {
          toolName: tool.name || toolProgress.tool_name || `Tool ${tool._id}`,
          labs: labs.map((lab) => {
            const labProgress = toolProgress.labs.find((l) => l.lab_id.toString() === lab._id.toString())
            return {
              name: lab.name || labProgress?.lab_name || `Lab ${lab._id}`,
              completion: labProgress ? labProgress.completion_percentage : 0,
              questionsCompleted: labProgress ? labProgress.completed_questions : 0,
              totalQuestions: labProgress ? labProgress.total_questions : 0,
              attempts: labProgress?.question_tracking?.question_attempts || [],
              scores: labProgress?.question_tracking?.question_scores || [],
            }
          }),
        }
      }),
    )

    // Calculate attempt statistics
    const attemptStats = calculateAttemptStats(userProgress)

    res.json({
      toolsProgress,
      labsProgress: labsProgress.filter(Boolean),
      attemptStats,
      overallCompletion: userProgress.overall_completion,
    })
  } catch (error) {
    console.error("Error getting analytics:", error)
    res.status(500).json({
      message: "Error getting analytics",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

// Helper function to calculate attempt statistics
function calculateAttemptStats(userProgress) {
  const stats = {
    firstAttempt: 0,
    secondAttempt: 0,
    thirdOrMore: 0,
    averageAttempts: 0,
    totalQuestions: 0,
  }

  // Check if tools array exists and has items
  if (!userProgress.tools || !Array.isArray(userProgress.tools) || userProgress.tools.length === 0) {
    return stats
  }

  userProgress.tools.forEach((tool) => {
    // Check if labs array exists
    if (!tool.labs || !Array.isArray(tool.labs)) return

    tool.labs.forEach((lab) => {
      // Check if question_tracking and question_attempts exist
      if (!lab.question_tracking || !Array.isArray(lab.question_tracking.question_attempts)) return

      lab.question_tracking.question_attempts.forEach((attempts) => {
        if (attempts === 1) stats.firstAttempt++
        else if (attempts === 2) stats.secondAttempt++
        else if (attempts > 2) stats.thirdOrMore++

        stats.totalQuestions++
        stats.averageAttempts += attempts
      })
    })
  })

  if (stats.totalQuestions > 0) {
    stats.averageAttempts = (stats.averageAttempts / stats.totalQuestions).toFixed(2)
  }

  return stats
}

