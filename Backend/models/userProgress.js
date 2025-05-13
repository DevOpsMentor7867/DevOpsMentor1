const mongoose = require("mongoose")

// Sub-schema for question tracking
const questionTrackingSchema = new mongoose.Schema(
  {
    questions_status: [Boolean],
    question_attempts: [Number],
    question_scores: [Number],
  },
  { _id: false },
)

// Sub-schema for lab progress
const labProgressSchema = new mongoose.Schema(
  {
    lab_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    lab_name: { type: String },
    total_questions: { type: Number, default: 0 },
    completed_questions: { type: Number, default: 0 },
    completion_percentage: { type: Number, default: 0 },
    current_question: { type: Number, default: 1 },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started",
    },
    time_spent: { type: Number, default: 0 },
    last_attempt: { type: Date, default: Date.now },
    question_tracking: questionTrackingSchema,
  },
  { _id: false },
)

// Sub-schema for tool progress
const toolProgressSchema = new mongoose.Schema(
  {
    tool_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    tool_name: { type: String },
    completion_percentage: { type: Number, default: 0 },
    time_spent: { type: Number, default: 0 },
    labs: [labProgressSchema],
  },
  { _id: false },
)

// Main user progress schema
const userProgressSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  overall_completion: { type: Number, default: 0 },
  total_time_spent: { type: Number, default: 0 },
  tools: [toolProgressSchema],
  last_updated: { type: Date, default: Date.now },
})

// Create indexes for faster queries
userProgressSchema.index("tools.tool_id")
userProgressSchema.index("tools.labs.lab_id")

// Pre-save middleware to calculate overall statistics
userProgressSchema.pre("save", function (next) {
  // Calculate overall completion percentage
  if (this.tools && this.tools.length > 0) {
    // Calculate tool-level statistics first
    this.tools.forEach((tool) => {
      if (tool.labs && tool.labs.length > 0) {
        const totalLabCompletion = tool.labs.reduce((sum, lab) => sum + lab.completion_percentage, 0)
        tool.completion_percentage = Math.round(totalLabCompletion / tool.labs.length)

        tool.time_spent = tool.labs.reduce((sum, lab) => sum + lab.time_spent, 0)
      }
    })

    // Then calculate user-level statistics
    const totalToolCompletion = this.tools.reduce((sum, tool) => sum + tool.completion_percentage, 0)
    this.overall_completion = Math.round(totalToolCompletion / this.tools.length)

    this.total_time_spent = this.tools.reduce((sum, tool) => sum + tool.time_spent, 0)
  }

  this.last_updated = new Date()
  next()
})

// Static method to update lab progress
userProgressSchema.statics.updateLabProgress = async function (userId, toolId, labId, updateData) {
  try {
    // First, try to find the existing user progress document
    let userProgress = await this.findOne({ user_id: userId })

    if (!userProgress) {
      // Create new user progress document if it doesn't exist
      userProgress = new this({
        user_id: userId,
        tools: [
          {
            tool_id: toolId,
            tool_name: updateData.tool_name || "Unknown Tool",
            labs: [
              {
                lab_id: labId,
                lab_name: updateData.lab_name || "Unknown Lab",
                total_questions: updateData.total_questions || 0,
                completed_questions: updateData.completed_questions || 0,
                completion_percentage: updateData.completion_percentage || 0,
                current_question: updateData.current_question || 1,
                status: updateData.status || "not_started",
                time_spent: updateData.time_spent || 0,
                last_attempt: updateData.last_attempt || new Date(),
                question_tracking: {
                  questions_status: updateData.questions_status || [],
                  question_attempts: updateData.question_attempts || [],
                  question_scores: Array(updateData.total_questions || 0).fill(0),
                },
              },
            ],
          },
        ],
      })
    } else {
      // Find the tool in the existing tools array
      const toolIndex = userProgress.tools.findIndex((tool) => tool.tool_id.toString() === toolId.toString())

      if (toolIndex === -1) {
        // Add new tool if it doesn't exist
        userProgress.tools.push({
          tool_id: toolId,
          tool_name: updateData.tool_name || "Unknown Tool",
          labs: [
            {
              lab_id: labId,
              lab_name: updateData.lab_name || "Unknown Lab",
              total_questions: updateData.total_questions || 0,
              completed_questions: updateData.completed_questions || 0,
              completion_percentage: updateData.completion_percentage || 0,
              current_question: updateData.current_question || 1,
              status: updateData.status || "not_started",
              time_spent: updateData.time_spent || 0,
              last_attempt: updateData.last_attempt || new Date(),
              question_tracking: {
                questions_status: updateData.questions_status || [],
                question_attempts: updateData.question_attempts || [],
                question_scores: Array(updateData.total_questions || 0).fill(0),
              },
            },
          ],
        })
      } else {
        // Find the lab in the existing labs array
        const labIndex = userProgress.tools[toolIndex].labs.findIndex(
          (lab) => lab.lab_id.toString() === labId.toString(),
        )

        if (labIndex === -1) {
          // Add new lab if it doesn't exist
          userProgress.tools[toolIndex].labs.push({
            lab_id: labId,
            lab_name: updateData.lab_name || "Unknown Lab",
            total_questions: updateData.total_questions || 0,
            completed_questions: updateData.completed_questions || 0,
            completion_percentage: updateData.completion_percentage || 0,
            current_question: updateData.current_question || 1,
            status: updateData.status || "not_started",
            time_spent: updateData.time_spent || 0,
            last_attempt: updateData.last_attempt || new Date(),
            question_tracking: {
              questions_status: updateData.questions_status || [],
              question_attempts: updateData.question_attempts || [],
              question_scores: Array(updateData.total_questions || 0).fill(0),
            },
          })
        } else {
          // Update existing lab
          const lab = userProgress.tools[toolIndex].labs[labIndex]

          // Update lab properties
          if (updateData.lab_name) lab.lab_name = updateData.lab_name
          if (updateData.total_questions !== undefined) lab.total_questions = updateData.total_questions
          if (updateData.completed_questions !== undefined) lab.completed_questions = updateData.completed_questions
          if (updateData.completion_percentage !== undefined)
            lab.completion_percentage = updateData.completion_percentage
          if (updateData.current_question !== undefined) lab.current_question = updateData.current_question
          if (updateData.status) lab.status = updateData.status
          if (updateData.time_spent !== undefined) lab.time_spent = updateData.time_spent

          // Update question tracking
          if (updateData.questions_status) {
            lab.question_tracking.questions_status = updateData.questions_status
          }
          if (updateData.question_attempts) {
            lab.question_tracking.question_attempts = updateData.question_attempts
          }

          // Calculate scores based on status and attempts
          const tracking = lab.question_tracking
          for (let i = 0; i < tracking.questions_status.length; i++) {
            if (tracking.questions_status[i]) {
              const attempts = tracking.question_attempts[i] || 0
              let score = 100 // Base score for correct answer

              if (attempts === 2) {
                score *= 0.6 // 40% deduction for second attempt
              } else if (attempts >= 3) {
                score = 0 // 100% deduction for third or more attempts
              }

              tracking.question_scores[i] = score
            } else {
              tracking.question_scores[i] = 0
            }
          }

          lab.last_attempt = new Date()
        }
      }
    }

    // Save the updated document
    await userProgress.save()
    return userProgress
  } catch (error) {
    console.error("Error updating lab progress:", error)
    throw error
  }
}

// Method to get progress for a specific lab
userProgressSchema.methods.getLabProgress = function (toolId, labId) {
  const tool = this.tools.find((t) => t.tool_id.toString() === toolId.toString())
  if (!tool) return null

  return tool.labs.find((lab) => lab.lab_id.toString() === labId.toString())
}

// Method to get progress for a specific tool
userProgressSchema.methods.getToolProgress = function (toolId) {
  return this.tools.find((tool) => tool.tool_id.toString() === toolId.toString())
}

// Add a method to calculate and update question scores
userProgressSchema.methods.updateQuestionScores = function (toolId, labId) {
  const tool = this.tools.find((t) => t.tool_id.toString() === toolId.toString())
  if (!tool) return false

  const lab = tool.labs.find((l) => l.lab_id.toString() === labId.toString())
  if (!lab) return false

  const tracking = lab.question_tracking
  if (!tracking) return false

  // Ensure arrays are properly initialized
  if (!Array.isArray(tracking.questions_status)) {
    tracking.questions_status = Array(lab.total_questions).fill(false)
  }
  if (!Array.isArray(tracking.question_attempts)) {
    tracking.question_attempts = Array(lab.total_questions).fill(0)
  }
  if (!Array.isArray(tracking.question_scores)) {
    tracking.question_scores = Array(lab.total_questions).fill(0)
  }

  // Calculate scores based on attempts
  let totalScore = 0
  for (let i = 0; i < tracking.questions_status.length; i++) {
    if (tracking.questions_status[i]) {
      const attempts = tracking.question_attempts[i] || 0
      let score = 100 // Base score for correct answer

      if (attempts === 2) {
        score *= 0.6 // 40% deduction for second attempt
      } else if (attempts >= 3) {
        score = 0 // 100% deduction for third or more attempts
      }

      tracking.question_scores[i] = score
      totalScore += score
    } else {
      tracking.question_scores[i] = 0 // Explicitly set score to 0 for incomplete questions
    }
  }

  // Update lab completion percentage based on scores
  const maxPossibleScore = lab.total_questions * 100
  lab.completion_percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0

  // Update completed questions count
  lab.completed_questions = tracking.questions_status.filter((status) => status).length

  return true
}

module.exports = mongoose.model("UserProgress", userProgressSchema)

