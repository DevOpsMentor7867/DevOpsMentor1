const Bull = require("bull");
const { connectToDatabase, mongoose } = require("../db/mongoose");
const redisClientPool = require("../redis/redis-server");
const Tool = require("../models/toolsModel");
const Lab = require("../models/labModel");

const db = mongoose.connections;

const getLabsQueue = new Bull("getLabs", {
  redis: { port: 6379, host: "localhost" },
});

getLabsQueue.process(async (job) => {
  try {
    const toolId = job.data.tool_id;

    const labs = await Lab.find({ tool_id: toolId }).populate("tool_id");
    return { labs };
  } catch (error) {
    console.error(`Error processing getLabs job:`, error);
    throw error;
  }
});

module.exports.getLabs = async (req, res) => {
  const { toolId } = req.params;
  try {
    const job = await getLabsQueue.add(
      { tool_id: toolId },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    const result = await job.finished();
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching labs:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch labs", error: error.message });
  }
};
