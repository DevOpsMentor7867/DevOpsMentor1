const mongoose = require("mongoose")
const redisClientPool = require("../redis/redis-server")
const UserProgress = require("../models/userProgress") // Changed from Progress
const Lab = require("../models/labModel")
const Tool = require("../models/toolsModel")
const LabQuestion = require("../models/questionsModel")

// Key prefixes for Redis
const SESSION_PREFIX = "session:"
const CONTAINER_PREFIX = "container:"

/**
 * Get user session data by socket ID
 */
async function getUserBySocketId(socketId) {
  let redisClient

  try {
    redisClient = await redisClientPool.borrowClient()

    // Get session data
    const sessionKey = `${SESSION_PREFIX}${socketId}`
    const sessionData = await redisClient.get(sessionKey)

    if (!sessionData) {
      console.log(`No session found for socket ID: ${socketId}`)
      return null
    }

    // Parse the JSON data
    const userData = JSON.parse(sessionData)

    // Get container ID or container data for Ansible
    const containerKey = `${CONTAINER_PREFIX}${socketId}`
    const containerData = await redisClient.get(containerKey)

    // Get progress data from MongoDB - updated for hierarchical model
    const userProgress = await UserProgress.findOne({
      user_id: userData.userId,
    })

    let labProgress = null
    if (userProgress) {
      labProgress = userProgress.getLabProgress(userData.toolId, userData.labId)
    }

    // Return the complete user record
    return {
      ...userData,
      containerData,
      progress: labProgress
        ? {
            user_id: userData.userId,
            tool_id: userData.toolId,
            lab_id: userData.labId,
            total_questions: labProgress.total_questions,
            completed_questions: labProgress.completed_questions,
            completion_percentage: labProgress.completion_percentage,
            current_question: labProgress.current_question,
            questions_status: labProgress.question_tracking.questions_status,
            question_attempts: labProgress.question_tracking.question_attempts,
            question_scores: labProgress.question_tracking.question_scores,
            status: labProgress.status,
            time_spent: labProgress.time_spent,
            last_attempt: labProgress.last_attempt,
          }
        : null,
    }
  } catch (error) {
    console.error("Error retrieving user record:", error)
    return null
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient)
  }
}

/**
 * Get or initialize progress for a user
 */
const getOrInitializeProgress = async (socketId, userId, toolId, labId) => {
  try {
    console.log(`📥 Checking MongoDB for progress - user: ${userId}, tool: ${toolId}, lab: ${labId}`)

    // Get user progress
    let userProgress = await UserProgress.findOne({ user_id: userId })
    let labProgress = null

    if (userProgress) {
      labProgress = userProgress.getLabProgress(toolId, labId)
      if (labProgress) {
        console.log(`✅ Found progress in MongoDB for user: ${userId}`)
        return {
          user_id: userId,
          tool_id: toolId,
          lab_id: labId,
          total_questions: labProgress.total_questions,
          completed_questions: labProgress.completed_questions,
          completion_percentage: labProgress.completion_percentage,
          current_question: labProgress.current_question,
          questions_status: labProgress.question_tracking.questions_status,
          question_attempts: labProgress.question_tracking.question_attempts,
          question_scores: labProgress.question_tracking.question_scores,
          status: labProgress.status,
          time_spent: labProgress.time_spent,
          last_attempt: labProgress.last_attempt,
        }
      }
    }

    // Get the total number of questions from MongoDB
    const labQuestions = await LabQuestion.findOne({ lab_id: labId })
    if (!labQuestions) {
      console.warn(`⚠️ No questions found for Lab: ${labId}`)
      return null
    }

    const totalQuestions = labQuestions.questions_data.length
    console.log(`✅ Total questions for Lab: ${labId}: ${totalQuestions}`)

    if (!totalQuestions || totalQuestions <= 0) {
      console.warn(`⚠️ No valid questions found for Lab: ${labId}.`)
      return null
    }

    // Get tool and lab names
    const tool = await Tool.findById(toolId)
    const lab = await Lab.findById(labId)

    // Initialize new progress
    const updateData = {
      tool_name: tool ? tool.name : "Unknown Tool",
      lab_name: lab ? lab.name : "Unknown Lab",
      total_questions: totalQuestions,
      questions_status: Array(totalQuestions).fill(false),
      question_attempts: Array(totalQuestions).fill(0),
      question_scores: Array(totalQuestions).fill(0),
      current_question: 1,
      completed_questions: 0,
      completion_percentage: 0,
      status: "not_started",
    }

    // Create or update user progress
    userProgress = await UserProgress.updateLabProgress(userId, toolId, labId, updateData)
    labProgress = userProgress.getLabProgress(toolId, labId)

    // Return in the format expected by the application
    return {
      user_id: userId,
      tool_id: toolId,
      lab_id: labId,
      total_questions: labProgress.total_questions,
      completed_questions: labProgress.completed_questions,
      completion_percentage: labProgress.completion_percentage,
      current_question: labProgress.current_question,
      questions_status: labProgress.question_tracking.questions_status,
      question_attempts: labProgress.question_tracking.question_attempts,
      question_scores: labProgress.question_tracking.question_scores,
      status: labProgress.status,
      time_spent: labProgress.time_spent,
      last_attempt: labProgress.last_attempt,
    }
  } catch (error) {
    console.error(`❌ Error getting or initializing progress for socket: ${socketId}`, error)
    return null
  }
}



module.exports = {
  getUserBySocketId,
  getOrInitializeProgress,
 
}

