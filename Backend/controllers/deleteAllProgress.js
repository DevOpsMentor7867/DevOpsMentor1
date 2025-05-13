const Redis = require("ioredis"); // Ensure Redis library is imported
const redisClientPool = new Redis(); // Create Redis connection

const deleteAllProgress = async () => {
  let redisClient;
  try {
    redisClient = redisClientPool; // Borrow Redis client directly

    let cursor = "0";
    do {
      // ✅ Scan for all progress keys
      const scanResult = await redisClient.scan(cursor, "MATCH", "progress:*", "COUNT", 100);
      cursor = scanResult[0]; // Update cursor for next scan
      const keys = scanResult[1]; // Get matching keys

      if (keys.length > 0) {
        await redisClient.del(...keys); // ✅ Delete all found progress keys
        console.log(`🗑️ Deleted ${keys.length} progress records from Redis.`);
      }
    } while (cursor !== "0"); // Continue scanning until all keys are found

  } catch (error) {
    console.error("❌ Error deleting all progress from Redis:", error);
  } finally {
    if (redisClient) redisClient.quit(); // Close Redis connection
  }
};

// ✅ Run the function
deleteAllProgress();
