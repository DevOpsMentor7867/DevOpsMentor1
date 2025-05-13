/*const redisClientPool = require('../redis/redis-server');
const dockerClientPool = require('../docker/docker_connection');
const { setUpSocketServer, getIo } = require('../socketServer/socket');
const Bull = require("bull");

const containerStart = new Bull("linuxContainerStart", {
  redis: { port: 6379, host: "localhost" },
});

const containerExec = new Bull("linuxContainerExecute", {
  redis: { port: 6379, host: "localhost" },
});

const containerClose = new Bull("linuxContainerClose", {
  redis: { port: 6379, host: "localhost" },
});

const setupTerminalNamespace = async () => {
  const io = getIo();
  const terminalNamespace = io.of('/terminal');

  terminalNamespace.on('connection', async (socket) => {
    console.log(`User connected to terminal: ${socket.id}`);

    // Start container for the connected user
    await containerStart.add({ socketId: socket.id });

    socket.on('terminal command', async (command) => {
      console.log(`Received command from ${socket.id}: ${command}`);
      await containerExec.add({ socketId: socket.id, command });
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      await containerClose.add({ socketId: socket.id });
    });
  });
};

// Queue to start containers
containerStart.process(process.env.containerWorkers || 2, async (job) => {
  const { socketId } = job.data;
  let dockerClient = await dockerClientPool.borrowClient();
  let redisClient = await redisClientPool.borrowClient();

  try {
    console.log(`Starting container for socket: ${socketId}`);
    const container = await dockerClient.createContainer({
      Image: 'ubuntu:latest',
      Cmd: ['/bin/bash'],
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: false,
    });

    await container.start();
    const containerId = container.id;
    await redisClient.set(`container:${socketId}`, containerId);
    console.log(`Container started: ${containerId} for socket ${socketId}`);
  } catch (error) {
    console.error(`Error starting container for socket ${socketId}:`, error);
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient);
    if (dockerClient) dockerClientPool.returnClient(dockerClient);
  }
});

// Queue to execute commands in containers
containerExec.process(process.env.containerWorkers || 2, async (job) => {
  const { socketId, command } = job.data;
  let dockerClient = await dockerClientPool.borrowClient();
  let redisClient = await redisClientPool.borrowClient();

  try {
    const containerId = await redisClient.get(`container:${socketId}`);
    if (!containerId) throw new Error(`No container found for socket: ${socketId}`);

    const container = dockerClient.getContainer(containerId);
    const exec = await container.exec({
      Cmd: ['/bin/bash', '-c', command],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    const stream = await exec.start({ hijack: true, stdin: true });
    stream.on('data', (chunk) => {
      const output = chunk.toString();
      console.log(`Command Output (${socketId}): ${output}`);
      const io = getIo();
      io.of('/terminal').to(socketId).emit('terminal output', { user: socketId, output });
    });
  } catch (error) {
    console.error(`Error executing command for socket ${socketId}:`, error);
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient);
    if (dockerClient) dockerClientPool.returnClient(dockerClient);
  }
});

// Queue to close containers
containerClose.process(process.env.containerWorkers || 2, async (job) => {
  const { socketId } = job.data;
  let dockerClient = await dockerClientPool.borrowClient();
  let redisClient = await redisClientPool.borrowClient();

  try {
    const containerId = await redisClient.get(`container:${socketId}`);
    if (!containerId) {
      console.log(`No container to close for socket: ${socketId}`);
      return;
    }

    const container = dockerClient.getContainer(containerId);
    await container.stop();
    await container.remove();
    await redisClient.del(`container:${socketId}`);
    console.log(`Container ${containerId} closed for socket ${socketId}`);
  } catch (error) {
    console.error(`Error closing container for socket ${socketId}:`, error);
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient);
    if (dockerClient) dockerClientPool.returnClient(dockerClient);
  }
});

module.exports = setupTerminalNamespace;*/




/*const setupTerminalNamespace = async () => {
  const io = getIo();
  const terminalNamespace = io.of('/terminal');

  terminalNamespace.on('connection', async (socket) => {
    console.log(`User connected to terminal: ${socket.id}`);
    await containerStart.add({ socketId: socket.id });

    socket.on('terminal command', async (command) => {
      console.log(`Received command from ${socket.id}: ${command}`);
      await containerExec.add({ socketId: socket.id, command });
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);
      await containerClose.add({ socketId: socket.id });
    });
  });
};

containerStart.process(process.env.containerWorkers || 2, async (job) => {
  const { socketId } = job.data;
  let dockerClient = await dockerClientPool.borrowClient();
  let redisClient = await redisClientPool.borrowClient();

  try {
    console.log(`Starting container for socket: ${socketId}`);
    const container = await dockerClient.createContainer({
      Image: 'ubuntu:latest',
      Cmd: ['/bin/bash'],
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: false,
    });

    await container.start();
    const containerId = container.id.substring(0, 12);
    await redisClient.set(`container:${socketId}`, containerId);
    console.log(`Container started: ${containerId} for socket ${socketId}`);

    // Set up a custom prompt
    await executeCommand(container, 'echo "PS1=\'\\u@\\h:\\w\\$ \'" >> ~/.bashrc && source ~/.bashrc', socketId);

    // Send the initial prompt to the frontend
    const dynamicPrompt = await getPrompt(container);
    console.log('dynamic promot is ', dynamicPrompt);
    const io = getIo();
    io.of('/terminal').to(socketId).emit('terminal output', {
      user: socketId,
      output: dynamicPrompt,
    });
  } catch (error) {
    console.error(`Error starting container for socket ${socketId}:`, error);
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient);
    if (dockerClient) dockerClientPool.returnClient(dockerClient);
  }
});

containerExec.process(process.env.containerWorkers || 2, async (job) => {
  const { socketId, command } = job.data;
  let dockerClient = await dockerClientPool.borrowClient();
  let redisClient = await redisClientPool.borrowClient();

  try {
    const containerId = await redisClient.get(`container:${socketId}`);
    if (!containerId) throw new Error(`No container found for socket: ${socketId}`);

    const container = dockerClient.getContainer(containerId);

    // Execute the command and stream the output
    await executeCommand(container, command, socketId);

    // Get the updated prompt
    const dynamicPrompt = await getPrompt(container);

    // Send the prompt to the frontend
    const io = getIo();
    io.of('/terminal').to(socketId).emit('terminal output', { 
      user: socketId, 
      output: dynamicPrompt
    });
  } catch (error) {
    console.error(`Error executing command for socket ${socketId}:`, error);
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient);
    if (dockerClient) dockerClientPool.returnClient(dockerClient);
  }
});

async function executeCommand(container, command, socketId) {
  const exec = await container.exec({
    Cmd: ['/bin/bash', '-c', command],
    AttachStdout: true,
    AttachStderr: true,
    Tty: true,
  });

  return new Promise((resolve, reject) => {
    exec.start(async (err, stream) => {
      if (err) return reject(err);

      const io = getIo();

      stream.on('data', (chunk) => {
        io.of('/terminal').to(socketId).emit('terminal output', {
          user: socketId,
          output: chunk.toString('utf8')
        });
      });

      stream.on('end', resolve);
    });
  });
}

async function getPrompt(container) {
  const exec = await container.exec({
    Cmd: ['/bin/bash', '-c', 'echo -n "$PS1"'],
    AttachStdout: true,
    AttachStderr: true,
    Tty: false,
  });

  return new Promise((resolve, reject) => {
    exec.start((err, stream) => {
      if (err) return reject(err);
      let prompt = '';
      stream.on('data', (chunk) => {
        prompt += chunk.toString('utf8');
      });
      stream.on('end', () => resolve(prompt));
    });
  });
}

containerClose.process(process.env.containerWorkers || 2, async (job) => {
  const { socketId } = job.data;
  let dockerClient = await dockerClientPool.borrowClient();
  let redisClient = await redisClientPool.borrowClient();

  try {
    const containerId = await redisClient.get(`container:${socketId}`);
    if (!containerId) {
      console.log(`No container to close for socket: ${socketId}`);
      return;
    }

    const container = dockerClient.getContainer(containerId);
    await container.stop();
    await container.remove();
    await redisClient.del(`container:${socketId}`);
    console.log(`Container ${containerId} closed for socket ${socketId}`);
  } catch (error) {
    console.error(`Error closing container for socket ${socketId}:`, error);
  } finally {
    if (redisClient) redisClientPool.returnClient(redisClient);
    if (dockerClient) dockerClientPool.returnClient(dockerClient);
  }
});

module.exports = setupTerminalNamespace;

console.log("Terminal server setup complete");*/


/*const setupTerminalNamespace = async () => {
  const io = getIo();
  const terminalNamespace = io.of('/terminal');

  terminalNamespace.on('connection', async (socket) => {
    console.log(`User connected to terminal: ${socket.id}`);

    // Borrow a Docker client from the pool
    let dockerClient = await dockerClientPool.borrowClient();
    let redisClient = await redisClientPool.borrowClient();

    // Create and start a new container for each connection
    const container = await dockerClient.createContainer({
      Image: 'ubuntu:latest',
      Cmd: ['/bin/bash'],
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      OpenStdin: true,
      StdinOnce: false,
    });

    console.log(`Starting the container for socket ID: ${socket.id}...`);
    await container.start();

    // Store the container ID against the socket ID in Redis
    const containerId = container.id;
    await redisClient.set(`container:${socket.id}`, containerId);

    // Get an exec instance to run commands inside the container
    const exec = await container.exec({
      Cmd: ['/bin/bash'],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });

    // Attach the PTY process to the Docker container
    const stream = await exec.start({ hijack: true, stdin: true });

    // Handle output from the container and send it to the client
    stream.on('data', (chunk) => {
      socket.emit('output', chunk.toString());
    });

    // Handle commands received from the client
    socket.on('command', async (message) => {
      let command = Buffer.isBuffer(message) ? message.toString('utf8') : message;

      console.log(`Received command from ${socket.id}: ${command}`);

      if (command !== "done_lab") {
        stream.write(command);
      }
    });

    // Handle socket disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);

      // Retrieve the container ID for this socket from Redis
      const storedContainerId = await redisClient.get(`container:${socket.id}`);
      if (storedContainerId) {
        const containerToStop = dockerClient.getContainer(storedContainerId);
        await containerToStop.stop();
        await containerToStop.remove();
        console.log(`Container ${storedContainerId} stopped and removed for socket ID: ${socket.id}`);
      }

      // Remove the container ID from Redis
      await redisClient.del(`container:${socket.id}`);
    });
  });
};*/


const redisClientPool = require('../redis/redis-server');
const dockerClientPool = require('../docker/docker_connection');
const { getIo } = require('../socketServer/socket');
const { getOrInitializeProgress } = require("./progress.js");
const Bull = require("bull");
const stream = require('stream');

const containerStart = new Bull("linuxContainerStart", { redis: { port: 6379, host: "localhost" } });
const containerExec = new Bull("linuxContainerExecute", { redis: { port: 6379, host: "localhost" } });
const containerClose = new Bull("linuxContainerClose", { redis: { port: 6379, host: "localhost" } });

const getSessionKey = (socketId) => `session:${socketId}`;
const getContainerKey = (socketId) => `container:${socketId}`;

const setupTerminalNamespace = async () => {
  const io = getIo();
  const terminalNamespace = io.of('/terminal');

  terminalNamespace.on('connection', async (socket) => {
    console.log(`🔌 User connected to terminal: ${socket.id}`);

    let redisClient = await redisClientPool.borrowClient();
    let dockerClient = await dockerClientPool.borrowClient();

    try {
      // ✅ Extract user session info from WebSocket authentication
      const { userId, toolId, labId, docker_image } = socket.handshake.auth;

      if (!userId || !toolId || !labId) {
        console.error(`❌ Missing session details for socket: ${socket.id}`);
        return;
      }

      console.log(`🛠 Storing session for user: ${userId}, tool: ${toolId}, lab: ${labId}`);

      // ✅ Store session in Redis (expires in 24 hours)
      const sessionData = { userId, toolId, labId, socketId: socket.id };
      await redisClient.setEx(getSessionKey(socket.id), 24 * 60 * 60, JSON.stringify(sessionData));

      console.log(`✅ Session stored in Redis for socket: ${socket.id}`);
      // ✅ Initialize Progress in Redis
      console.log(`🛠 Initializing progress for ${socket.id}`);
      await getOrInitializeProgress(socket.id,userId,toolId, labId);
       
      // ✅ Create and start a container for each connection
      console.log(`🛠 Creating container for socket ID: ${socket.id} using image: ${docker_image}...`);
      const container = await dockerClient.createContainer({
        Image: docker_image || "ubuntu:latest",
        Cmd: ['/bin/bash'],
        Tty: true,
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        OpenStdin: true,
        StdinOnce: false,
        HostConfig: { Privileged: true, CapAdd: ['ALL'] },
      });

      await container.start();
      const containerId = container.id;

      // ✅ Store container ID in Redis
      await redisClient.set(getContainerKey(socket.id), containerId);
      console.log(`✅ Container stored in Redis: ${containerId}`);

      // ✅ Set up command execution
      const exec = await container.exec({
        Cmd: ['/bin/bash'],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
      });

      const stream = await exec.start({ hijack: true, stdin: true });

      // ✅ Handle terminal output
      stream.on('data', (chunk) => {
        socket.emit('output', chunk.toString());
      });

      // ✅ Handle incoming commands
      socket.on('command', async (command) => {
        if (command !== "done_lab") {
          stream.write(command);
        }
      });

      // ✅ Handle disconnection
      socket.on('disconnect', async () => {
        console.log(`❌ User disconnected: ${socket.id}`);

        const storedContainerId = await redisClient.get(getContainerKey(socket.id));
        if (storedContainerId) {
          const containerToStop = dockerClient.getContainer(storedContainerId);
          await containerToStop.stop();
          await containerToStop.remove();
          console.log(`🛑 Container ${storedContainerId} stopped and removed`);
        }

        // ✅ Remove session and container from Redis
        await redisClient.del(getContainerKey(socket.id));
        await redisClient.del(getSessionKey(socket.id));
        console.log(`🗑️ Session data removed from Redis for socket: ${socket.id}`);
      });

    } catch (error) {
      console.error("❌ Error in terminal connection:", error);
    } finally {
      if (redisClient) redisClientPool.returnClient(redisClient);
      if (dockerClient) dockerClientPool.returnClient(dockerClient);
    }
  });
};

module.exports = setupTerminalNamespace;
