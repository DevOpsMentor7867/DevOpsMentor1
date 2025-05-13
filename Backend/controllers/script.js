const Bull = require("bull")
const Docker = require("dockerode")
const dockerClientPool = require("../docker/docker_connection")
const redisClientPool = require("../redis/redis-server")
const { exec } = require("child_process")
const UserProgress = require("../models/userProgress")
const LabQuestion = require("../models/questionsModel")
const Tool = require("../models/toolsModel")
const Lab = require("../models/labModel")

// Create a Bull queue for script execution
const containerExec = new Bull("linuxContainerExecute", {
  redis: { port: 6379, host: "localhost" },
})

// Helper functions for Redis keys
const getSessionKey = (socketId) => `session:${socketId}`
const getContainerKey = (socketId) => `container:${socketId}`

// Process jobs in the queue
containerExec.process(async (job) => {
  const { socketId, script, toolName, questionNumber } = job.data
  console.log(` Processing job for socket: ${socketId}, tool: ${toolName}, question: ${questionNumber}`)

  let dockerClient
  let redisClient

  try {
    dockerClient = await dockerClientPool.borrowClient()
    redisClient = await redisClientPool.borrowClient()

    // Fetch session info from Redis
    const sessionData = await redisClient.get(getSessionKey(socketId))
    if (!sessionData) throw new Error(`No session found for socket: ${socketId}`)

    const { userId, toolId, labId } = JSON.parse(sessionData)
    let containerId

    // Handle Kubernetes tool
    if (toolName === "Kubernetes") {
      console.log(" Executing Kubernetes script check")
      const uniqueUser = await redisClient.get(`${socketId}`)
      if (!uniqueUser) throw new Error(`No Kubernetes namespace found for SocketID: ${socketId}`)

      console.log(" Kubernetes user retrieved:", uniqueUser)

      const kubernetesOutput = await new Promise((resolve, reject) => {
        exec(`bash -c "${script}"`, (error, stdout, stderr) => {
          if (error && !stdout && !stderr) {
            console.error(` Execution error: ${error.message}`)
            return reject(new Error(error.message))
          }

          const combinedOutput = `${stdout}${stderr}`.trim()
          const match = combinedOutput.match(/\b[01]\b/)
          if (!match) return reject(new Error("Unexpected output format."))

          resolve(match[0])
        })
      })

      await updateQuestionProgress(userId, toolId, labId, questionNumber, kubernetesOutput === "1")
      return { result: kubernetesOutput === "1" ? 1 : 0 }
    }

    // Handle Ansible tool
    else if (toolName === "Ansible") {
      console.log(" Executing Ansible script check")
      const storedData = await redisClient.get(`container:${socketId}`)
      if (!storedData) throw new Error("No Ansible containers found for this socket.")

      const { containers } = JSON.parse(storedData)
      containerId = containers[`control-node`]
      console.log(` Using Ansible control-node container: ${containerId}`)
    }

    // Handle Jenkins tool
    else if (toolName === "Jenkins") {
      console.log("🔄 Executing Jenkins script check")
      const storedData = await redisClient.get(`jenkins:${socketId}`)
      if (!storedData) throw new Error(`No Jenkins container found for SocketID: ${socketId}`)

      const parsedData = JSON.parse(storedData)
      if (!parsedData.containerId) throw new Error("Jenkins container ID is missing.")

      containerId = parsedData.containerId
      console.log(` Using Jenkins container: ${containerId}`)
    }

    // Handle default/standard container
    else {
      containerId = await redisClient.get(getContainerKey(socketId))
      if (!containerId) throw new Error(`No container found for socket: ${socketId}`)
      console.log(` Using standard container: ${containerId}`)
    }

    // Execute script in the container
    const container = dockerClient.getContainer(containerId)
    const execCheck = await container.exec({
      Cmd: ["bash", "-c", script],
      AttachStdout: true,
      AttachStderr: true,
    })

    const stream = await execCheck.start()
    const output = await new Promise((resolve, reject) => {
      let result = ""
      stream.on("data", (chunk) => (result += chunk.toString()))
      stream.on("end", () => resolve(result.trim()))
      stream.on("error", (err) => reject(err))
    })

    console.log(` Script executed for socket: ${socketId}`)
    console.log(" Verification output:", output)

    const isCorrect = output.includes("1")
    console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^")
    await updateQuestionProgress(userId, toolId, labId, questionNumber, isCorrect)

    return { result: isCorrect ? 1 : 0 }
  } catch (error) {
    console.error(" Error during script execution:", error)
    throw new Error(`Script execution failed: ${error.message}`)
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient)
    if (dockerClient) dockerClientPool.returnClient(dockerClient)
  }
})

const scriptExecute = async (req, res) => {
  console.log("Received script execution request");
  const { socketId, script, toolName, questionNumber, labId, checkAnswer } = req.body;
  console.log(socketId, script, toolName, questionNumber, labId, checkAnswer, "&&&&&&&&&&&&&&&&&&&&&&&&&&&&");

  if (!socketId || !script) {
    return res.status(400).json({ message: "Socket ID and script are required" });
  }
  console.log("HELLLLLLLLLLLLO");

  let redisClient;
  try {
    redisClient = await redisClientPool.borrowClient();
    console.log("Redis client borrowed");

    // Fetch session data from Redis
    const sessionData = await redisClient.get(getSessionKey(socketId));
    console.log("Session data fetched:", sessionData);

    if (!sessionData) {
      return res.status(400).json({ message: "Session data not found" });
    }

    const { userId, toolId, labId } = JSON.parse(sessionData);
    console.log(`User session found: userId=${userId}, toolId=${toolId}, labId=${labId}`);

    const userProgress = await UserProgress.findOne({ user_id: userId });
    console.log("User progress:", userProgress);

    if (userProgress) {
      const labProgress = userProgress.getLabProgress(toolId, labId);
      if (labProgress) {
        console.log(`➡️ Resuming from question: ${questionNumber}`);
      } else {
        console.log(`No existing lab progress found. Setting question to 1.`);
      }
    } else {
      console.log(`No existing user progress found. Setting question to 1.`);
    }

    console.log(`Processing Question: ${questionNumber}`);

    // Prevent duplicate job submission
    const existingJobs = await containerExec.getRepeatableJobs();
    console.log("Existing jobs:", existingJobs);

    if (existingJobs.some((job) => job.data.questionNumber === questionNumber && job.data.socketId === socketId)) {
      console.log(`A job is already running for this question. Skipping duplicate request.`);
      return res.status(429).json({ message: "Request already in progress" });
    }

    // Add to processing queue (LIMIT ATTEMPTS TO 1)
    const job = await containerExec.add(
      { socketId, script, toolName, questionNumber },
      { attempts: 1, backoff: { type: "fixed", delay: 2000 } }
    );
    console.log("Job added to queue:", job.id);

    const result = await job.finished();
    console.log(`Checking answer for socket: ${socketId}, Question: ${questionNumber}, Result: ${result.result}`);

    return res.status(200).json({
      message: "Script execution completed",
      current_question: questionNumber,
      result: result.result,
    });
  } catch (error) {
    console.error("Error executing script:", error);
    res.status(500).json({
      message: "Failed to execute script",
      error: error.message,
    });
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient);
  }
};

// Check answer endpoint
const checkAnswer = async (req, res) => {
  const { socketId, script, toolName, questionNumber, checkAnswer } = req.body

  if (!socketId || !script) {
    return res.status(400).json({ message: "Socket ID and script are required" })
  }

  let redisClient
  try {
    redisClient = await redisClientPool.borrowClient()

    //  Fetch session data from Redis
    const sessionData = await redisClient.get(getSessionKey(socketId))
    if (!sessionData) {
      return res.status(400).json({ message: "Session data not found" })
    }

    const { userId, toolId, labId } = JSON.parse(sessionData)

    // Pass questionNumber to queue
    const job = await containerExec.add(
      { socketId, script, toolName, questionNumber }, // ✅ Ensure questionNumber is included
      { attempts: 3, backoff: { type: "exponential", delay: 2000 } },
    )

    const result = await job.finished()

    //  Update question progress
    try {
      console.log(` Progress updated for user: ${userId}, question: ${questionNumber}`)

      return res.status(200).json({
        message: "Answer checked successfully",
        result: result.result,
        correct: result.result === 1,
      })
    } catch (error) {
      console.error("Error updating question progress:", error)
      return res.status(500).json({ message: "Failed to update progress", error: error.message })
    }
  } catch (error) {
    console.error(" Error checking answer:", error)
    res.status(500).json({ message: "Failed to check answer", error: error.message })
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient)
  }
}

// Updated to work with hierarchical user progress
const updateQuestionProgress = async (userId, toolId, labId, questionNumber, isCorrect) => {
  console.log(" Updating question progress...")

  try {
    // Get lab questions to know total count
    const labQuestions = await LabQuestion.findOne({ lab_id: labId })
    if (!labQuestions) {
      throw new Error(`Lab questions not found for lab: ${labId}`)
    }

    // Get tool and lab names for better display
    const tool = await Tool.findById(toolId)
    const lab = await Lab.findById(labId)

    const totalQuestions = labQuestions.questions_data.length
    const questionIndex = questionNumber - 1

    if (questionIndex < 0 || questionIndex >= totalQuestions) {
      throw new Error(`Invalid question number: ${questionNumber}`)
    }

    // Get user progress or initialize if not exists
    let userProgress = await UserProgress.findOne({ user_id: userId })
    let labProgress = null

    if (userProgress) {
      labProgress = userProgress.getLabProgress(toolId, labId)
    }

    // Prepare update data
    const updateData = {
      tool_name: tool ? tool.name : "Unknown Tool",
      lab_name: lab ? lab.name : "Unknown Lab",
      total_questions: totalQuestions,
    }

    if (!labProgress) {
      // Initialize new lab progress
      updateData.questions_status = Array(totalQuestions).fill(false)
      updateData.question_attempts = Array(totalQuestions).fill(0)
      updateData.question_scores = Array(totalQuestions).fill(0)
      updateData.current_question = 1
      updateData.completed_questions = 0
      updateData.completion_percentage = 0
      updateData.status = "not_started"
    } else {
      // Use existing data
      updateData.questions_status = [...labProgress.question_tracking.questions_status]
      updateData.question_attempts = [...labProgress.question_tracking.question_attempts]
      updateData.question_scores = [...labProgress.question_tracking.question_scores]
      updateData.current_question = labProgress.current_question
      updateData.completed_questions = labProgress.completed_questions
      updateData.completion_percentage = labProgress.completion_percentage
      updateData.status = labProgress.status
      updateData.time_spent = labProgress.time_spent
    }

    // Update attempts with debouncing
    if (!labProgress || updateData.question_attempts[questionIndex] === 0) {
      updateData.question_attempts[questionIndex] = 1
    } else {
      const lastAttemptTime = labProgress.last_attempt.getTime()
      const currentTime = new Date().getTime()

      if (currentTime - lastAttemptTime > 500) {
        // 500ms debounce
        updateData.question_attempts[questionIndex] += 1
      } else {
        console.log(` Skipping duplicate attempt increment for question ${questionNumber}`)
      }
    }

    // Update question status if correct
    if (isCorrect) {
      updateData.questions_status[questionIndex] = true

      // Calculate score based on attempts
      const attempts = updateData.question_attempts[questionIndex]
      let score = 100 // Base score for correct answer

      if (attempts === 2) {
        score *= 0.6 // 40% deduction for second attempt
      } else if (attempts >= 3) {
        score = 0 // 100% deduction for third or more attempts
      }

      // Explicitly update the score for this question
      updateData.question_scores[questionIndex] = score

      updateData.completed_questions = updateData.questions_status.filter((status) => status).length
      updateData.completion_percentage = Math.round((updateData.completed_questions / totalQuestions) * 100)

      const nextUnansweredIndex = updateData.questions_status.findIndex((status) => !status)
      updateData.current_question = nextUnansweredIndex !== -1 ? nextUnansweredIndex + 1 : totalQuestions

      updateData.status =
        updateData.completed_questions === 0
          ? "not_started"
          : updateData.completed_questions === totalQuestions
            ? "completed"
            : "in_progress"
    }

    // Update user progress using the static method
    userProgress = await UserProgress.updateLabProgress(userId, toolId, labId, updateData)

    // Explicitly call updateQuestionScores to ensure scores are calculated
    if (userProgress) {
      userProgress.updateQuestionScores(toolId, labId)
      await userProgress.save()
    }

    // Get the updated lab progress
    labProgress = userProgress.getLabProgress(toolId, labId)

    console.log(
      ` Progress updated! Next question: ${labProgress.current_question}, Completion: ${labProgress.completion_percentage}%`,
    )
    return labProgress
  } catch (error) {
    console.error(" Error updating question progress:", error)
    throw error
  }
}

// End lab session - updated for hierarchical model
const endLab = async (req, res) => {
  const { toolId, labId } = req.params
  const userId = req.user._id

  try {
    // Get user progress
    const userProgress = await UserProgress.findOne({ user_id: userId })

    if (!userProgress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this user",
      })
    }

    // Get lab progress
    const labProgress = userProgress.getLabProgress(toolId, labId)

    if (!labProgress) {
      return res.status(404).json({
        success: false,
        message: "No progress found for this lab",
      })
    }

    // Update last attempt timestamp
    const toolIndex = userProgress.tools.findIndex((tool) => tool.tool_id.toString() === toolId.toString())
    const labIndex = userProgress.tools[toolIndex].labs.findIndex((lab) => lab.lab_id.toString() === labId.toString())

    userProgress.tools[toolIndex].labs[labIndex].last_attempt = new Date()
    await userProgress.save()

    res.json({
      success: true,
      message: "Lab ended successfully",
      progress: {
        completedQuestions: labProgress.completed_questions,
        totalQuestions: labProgress.total_questions,
        completionPercentage: labProgress.completion_percentage,
        timeSpent: labProgress.time_spent,
        status: labProgress.status,
        questionsStatus: labProgress.question_tracking.questions_status,
      },
    })
  } catch (error) {
    console.error("Error ending lab:", error)
    res.status(500).json({
      success: false,
      message: "Error ending lab",
      error: error.message,
    })
  }
}

// Get lab progress - updated for hierarchical model
const getLabProgress = async (req, res) => {
  try {
    const { toolId, labId } = req.params
    const userId = req.user._id

    // First, get the lab questions to know total count
    const labQuestions = await LabQuestion.findOne({ lab_id: labId })

    if (!labQuestions) {
      return res.status(404).json({ message: "Lab questions not found" })
    }

    const totalQuestions = labQuestions.questions_data.length

    // Get user progress
    let userProgress = await UserProgress.findOne({ user_id: userId })
    let labProgress = null

    if (userProgress) {
      labProgress = userProgress.getLabProgress(toolId, labId)
    }

    if (!labProgress) {
      // Get tool and lab names
      const tool = await Tool.findById(toolId)
      const lab = await Lab.findById(labId)

      // Create new progress
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

      userProgress = await UserProgress.updateLabProgress(userId, toolId, labId, updateData)
      labProgress = userProgress.getLabProgress(toolId, labId)
    } else if (labProgress.total_questions !== totalQuestions) {
      // Update if total_questions is wrong
      const toolIndex = userProgress.tools.findIndex((tool) => tool.tool_id.toString() === toolId.toString())
      const labIndex = userProgress.tools[toolIndex].labs.findIndex((lab) => lab.lab_id.toString() === labId.toString())

      // Update total questions
      userProgress.tools[toolIndex].labs[labIndex].total_questions = totalQuestions

      // Ensure arrays have correct length
      const lab = userProgress.tools[toolIndex].labs[labIndex]
      lab.question_tracking.questions_status = lab.question_tracking.questions_status
        .slice(0, totalQuestions)
        .concat(Array(Math.max(0, totalQuestions - lab.question_tracking.questions_status.length)).fill(false))

      lab.question_tracking.question_attempts = lab.question_tracking.question_attempts
        .slice(0, totalQuestions)
        .concat(Array(Math.max(0, totalQuestions - lab.question_tracking.question_attempts.length)).fill(0))

      lab.question_tracking.question_scores = lab.question_tracking.question_scores
        .slice(0, totalQuestions)
        .concat(Array(Math.max(0, totalQuestions - lab.question_tracking.question_scores.length)).fill(0))

      await userProgress.save()
      labProgress = userProgress.getLabProgress(toolId, labId)
    }

    // Format the response to match the expected structure
    const formattedLabProgress = {
      _id: userProgress._id,
      user_id: userProgress.user_id,
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

    res.status(200).json(formattedLabProgress)
  } catch (error) {
    console.error("Error in getLabProgress:", error)
    res.status(500).json({ message: "Failed to get lab progress", error: error.message })
  }
}

// Event handlers for the queue
containerExec.on("completed", (job, result) => {
  console.log(` Job ${job.id} completed with result: ${JSON.stringify(result)}`)
})

containerExec.on("failed", (job, err) => {
  console.error(` Job ${job.id} failed with error: ${err.message}`)
})

module.exports = {
  scriptExecute,
  checkAnswer,
  endLab,
  getLabProgress,
  updateQuestionProgress,
}

