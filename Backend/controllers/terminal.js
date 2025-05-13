//not used 
const redis = require("redis");
const Bull = require("bull");
const Docker = require("dockerode");
const dockerClientPool = require("../docker/docker_connection");
const redisClientPool = require("../redis/redis-server");


// Queue
const linuxContainerQueue = new Bull("linuxContainer", {
    redis: { port: 6379, host: "localhost" },
});

const stopContainerQueue = new Bull("stopContainer", {
    redis: { port: 6379, host: "localhost" },
});

linuxContainerQueue.process(async (job) => {
    const { sessionId, imageName } = job.data;

    let dockerClient = await dockerClientPool.borrowClient();
    let redisClient = await redisClientPool.borrowClient();

    try {
        const existingContainer = await redisClient.get(`container:${sessionId}`);
        if (existingContainer) {
            console.log(`Container already exists for session: ${sessionId}`);
            return { message: "Container already exists", containerId: existingContainer };
        }

        const container = await dockerClient.createContainer({
            Image: imageName || "ubuntu:latest",
            Cmd: ["/bin/bash"],
            Tty: true,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            StdinOnce: false,
        });


        
        await container.start();

        const containerId = container.id.slice(0, 12);;
        await redisClient.set(`container:${sessionId}`, containerId);

        console.log(`Container started for session ${sessionId} with ID: ${containerId}`);

        return { message: "Container created successfully", containerId };
    } catch (error) {
        console.error(`Error processing container creation for session ${sessionId}:`, error);
        throw error;
    } finally {
        if (redisClient) redisClientPool.returnClient(redisClient);
        if (dockerClient) dockerClientPool.returnClient(dockerClient);
    }
});

module.exports.linuxTerminal = async (req, res) => {
    try {
        const { dockerImage } = req.body;
        const sessionId = req.user.sessionId;
        console.log(`Received container start request for session: ${sessionId} with image: ${dockerImage}`);

        const job = await linuxContainerQueue.add(
            { sessionId, imageName: dockerImage },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
            }
        );

        const result = await job.finished();
        console.log(`Container creation job completed for session ${sessionId}:`, result);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error starting container:", error);
        res.status(500).json({ message: "Failed to start container", error: error.message });
    }
};

// stoping and deleting the container

stopContainerQueue.process(async (job) => {

    const { sessionId } = job.data;
    let dockerClient = await dockerClientPool.borrowClient();
    let redisClient = await redisClientPool.borrowClient();
    try {
        const containerId = await redisClient.get(`container:${sessionId}`);
        if (!containerId) {
            console.log(`No container found for session: ${sessionId}`);
            return { message: "No container found for the given session ID" };
        }
        const container = dockerClient.getContainer(containerId);
        console.log(`Stopping container with ID: ${containerId}`);
        await container.stop();
        console.log(`Removing container with ID: ${containerId}`);
        await container.remove();
        await redisClient.del(`container:${sessionId}`);
        return { message: "Container and image deleted successfully" };

    } catch {
        console.error(`Error processing stop/delete for session ${sessionId}:`, error);
    }finally {
        if (redisClient) redisClientPool.returnClient(redisClient);
        if (dockerClient) dockerClientPool.returnClient(dockerClient);
      }


});


module.exports.stopAndDeleteContainer = async (req, res) => {
    try {
        const sessionId = req.user.sessionId;
        console.log(`Received stop and delete request for session: ${sessionId}`);

        const job = await stopContainerQueue.add(
            { sessionId },
            {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
            }
        );

        const result = await job.finished();
        console.log(`Stop and delete job completed for session ${sessionId}:`, result);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error stopping and deleting container:", error);
        res.status(500).json({ message: "Failed to stop and delete container", error: error.message });
    }
};




