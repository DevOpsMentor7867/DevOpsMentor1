// DevOps tools controller
const Bull = require("bull");
const { connectToDatabase, mongoose } = require('../db/mongoose');
const redisClientPool = require("../redis/redis-server");
const Tool = require('../models/toolsModel');

const db = mongoose.connections;
const getToolsQueue = new Bull("getTools", {
    redis: { port: 6379, host: "localhost" }, 
});

getToolsQueue.process(async (job) => {
    try {
        // Using the Mongoose model directly instead of raw MongoDB collection
        const tools = await Tool.find({});  // Mongoose method for querying
        return { tools };
    } catch (error) {
        console.error(`Error processing getTools job:`, error);
        throw error;
    }
});

// Controller method to get tools from queue
module.exports.getTools = async (req, res) => {
    try {
        // Add job to Bull queue with retries and exponential backoff
        const job = await getToolsQueue.add({}, {
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 2000,
            },
        });

        // Wait for job completion and get the result
        const result = await job.finished();
        res.status(200).json(result);
    } catch (error) {
        // Handle error properly
        console.error("Error fetching tools:", error);
        res.status(500).json({ message: "Failed to fetch tools", error: error.message });
    }
};
