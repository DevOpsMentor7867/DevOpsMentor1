const { setUpSocketServer, getIo } = require("../socketServer/socket")
const redisClientPool = require("../redis/redis-server")
const Docker = require("dockerode")
const path = require("path")
const { promisify } = require("util")
const childProcess = require("child_process")
const exec = promisify(childProcess.exec)
const Convert = require('ansi-to-html');
const convert = new Convert();

const setupAnsibleTerminalNamespace = async () => {
  const io = getIo()
  const AnsibleterminalNamespace = io.of("/Ansible-terminal")
  const docker = new Docker()

  AnsibleterminalNamespace.on("connection", async (socket) => {
    const composeFilePath = "./controllers/AnsibleComposeFile/docker-compose.yaml"
    const redisClient = await redisClientPool.borrowClient()

    console.log(`User connected to terminal: ${socket.id}`)

    try {
      // Start docker-compose
      const { stdout } = await exec(`docker-compose -f ${composeFilePath} up -d`)
      console.log("Docker containers started successfully!")
      console.log(stdout)

      // Save the socket ID and the state of the compose setup in Redis
      await redisClient.set(`compose:${socket.id}`, "running")

      // Get the container instance
      const container = docker.getContainer("DM-control-node")

      // Create an exec instance
      const execInstance = await container.exec({
        Cmd: ["/bin/bash"],
        AttachStdin: true,
        AttachStdout: true,
        AttachStderr: true,
        Tty: true,
        Env: ["LANG=C.UTF-8", "LC_ALL=C.UTF-8", "TERM=xterm-256color"]
      });

      // Start the exec instance
      const stream = await execInstance.start({ hijack: true, stdin: true })

      // Handle output from the container and send it to the client
      stream.on("data", (chunk) => {
        socket.emit("output", chunk.toString())
      })

      // Handle incoming commands
      socket.on("command", async (command) => {
        if (command !== "done_lab") {
          stream.write(command)
        }
      })

      // Handle disconnection: tear down containers
      socket.on("disconnect", async () => {
        console.log(`User disconnected: ${socket.id}`)
        const composeStatus = await redisClient.get(`compose:${socket.id}`)
        if (composeStatus === "running") {
          try {
            await exec(`docker-compose -f ${composeFilePath} down`)
            console.log("Docker containers stopped successfully!")
          } catch (downError) {
            console.error(`Error stopping containers: ${downError.message}`)
          }
          await redisClient.del(`compose:${socket.id}`)
        }
        stream.end()
      })
    } catch (err) {
      console.error("Error:", err)
      socket.emit("error", "Failed to set up the environment or connect to the container.")
    }
  })
}

module.exports = setupAnsibleTerminalNamespace

