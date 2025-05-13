const Bull = require("bull");
const Docker = require("dockerode");
const dockerClientPool = require("../docker/docker_connection");
const redisClientPool = require("../redis/redis-server");
const exec = require("child_process").exec;

// Queue for starting containers using Docker Compose
const linuxContainerQueue = new Bull("linuxContainer", {
    redis: { port: 6379, host: "localhost" },
});

const stopContainerQueue = new Bull("stopContainer", {
    redis: { port: 6379, host: "localhost" },
});

// Process the job to start containers with Docker Compose
linuxContainerQueue.process(async (job) => {
    const { sessionId, composeFilePath } = job.data;

    let redisClient = await redisClientPool.borrowClient();
    try {
        // Check if a container for this session already exists
        const existingContainer = await redisClient.get(`container:${sessionId}`);
        if (existingContainer) {
            console.log(`Container already exists for session: ${sessionId}`);
            return { message: "Container already exists", containerId: existingContainer };
        }

        // Use Docker Compose to spin up the containers
        console.log(`Starting containers for session: ${sessionId} using Docker Compose`);
        await runDockerComposeUp(composeFilePath);  // Run docker-compose to start the containers

        // Fetch the container ID(s) from Docker Compose (You may need to adjust this based on the Compose setup)
        const containerIds = await getContainerIdsFromCompose(composeFilePath);
        
        // Store the container ID(s) in Redis for future reference
        await redisClient.set(`container:${sessionId}`, JSON.stringify(containerIds));

        console.log(`Containers started for session ${sessionId} with IDs: ${containerIds}`);

        return { message: "Containers created successfully", containerIds };
    } catch (error) {
        console.error(`Error processing container creation for session ${sessionId}:`, error);
        throw error;
    } finally {
        if (redisClient) redisClientPool.returnClient(redisClient);
    }
});

// Function to run docker-compose up for the given file
function runDockerComposeUp(composeFilePath) {
    return new Promise((resolve, reject) => {
        exec(`docker-compose -f ${composeFilePath} up -d`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error starting containers: ${stderr || error.message}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

// Function to fetch container IDs from Docker Compose
function getContainerIdsFromCompose(composeFilePath) {
    return new Promise((resolve, reject) => {
        exec(`docker-compose -f ${composeFilePath} ps -q`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error fetching container IDs: ${stderr || error.message}`);
            } else {
                // Return the container IDs as an array
                resolve(stdout.trim().split("\n"));
            }
        });
    });
}

module.exports.AnsiblelinuxTerminal = async (req, res) => {
    try {
        const { composeFilePath } = req.body; // Path to the docker-compose.yml file
        const sessionId = req.user.sessionId;
        console.log(`Received container start request for session: ${sessionId} with compose file: ${composeFilePath}`);

        const job = await linuxContainerQueue.add(
            { sessionId, composeFilePath },
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
        res.status(500).json({ message: "Failed to start containers", error: error.message });
    }
};

// Process the job to stop and delete containers created by Docker Compose
stopContainerQueue.process(async (job) => {
    const { sessionId } = job.data;
    let redisClient = await redisClientPool.borrowClient();
    try {
        const containerIds = await redisClient.get(`container:${sessionId}`);
        if (!containerIds) {
            console.log(`No containers found for session: ${sessionId}`);
            return { message: "No containers found for the given session ID" };
        }

        // Use Docker Compose to stop and remove the containers
        console.log(`Stopping and removing containers for session: ${sessionId}`);
        await runDockerComposeDown(containerIds);  // Run docker-compose down to stop and remove containers

        await redisClient.del(`container:${sessionId}`);

        return { message: "Containers stopped and removed successfully" };
    } catch (error) {
        console.error(`Error processing stop/delete for session ${sessionId}:`, error);
        throw error;
    } finally {
        if (redisClient) redisClientPool.returnClient(redisClient);
    }
});

// Function to run docker-compose down to stop and remove containers
function runDockerComposeDown(containerIds) {
    return new Promise((resolve, reject) => {
        exec(`docker-compose down`, (error, stdout, stderr) => {
            if (error) {
                reject(`Error stopping and removing containers: ${stderr || error.message}`);
            } else {
                resolve(stdout);
            }
        });
    });
}

module.exports.stopAndDeleteAnsibleContainer = async (req, res) => {
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
        res.status(500).json({ message: "Failed to stop and delete containers", error: error.message });
    }
};
