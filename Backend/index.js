require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const { createServer } = require("http");
const { connectToDatabase, mongoose } = require("./db/mongoose");
const redisClientPool = require("./redis/redis-server");
const dockerClientPool = require("./docker/docker_connection");
const execInstancePool = require("./docker/execPool");
const { setUpSocketServer, getIo } = require("./socketServer/socket");
const setupTerminalNamespace = require("./controllers/terminalSocket");
const setupJenkinsNamespace = require("./controllers/jenkins");
const setupAnsibleTerminalNamespace = require("./controllers/AnsibleTerminalSocket");
const setupKubernetesNamespace = require("./controllers/k8");
const cors = require("cors");
const app = express();

app.use(
  cors({
    origin: "http://localhost:3000", // Replace with your frontend URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

const httpServer = createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// Use the combined routes
app.use("/", routes);

const initializeApp = async () => {
  try {
    await connectToDatabase();

    await setUpSocketServer(httpServer);

    await redisClientPool.initialize();

    await dockerClientPool.initialize();

    setupTerminalNamespace();
    setupAnsibleTerminalNamespace();
    await setupJenkinsNamespace();
    setupKubernetesNamespace();

    const port = process.env.PORT || 3000;
    httpServer.listen(port, () => {
      console.log(`Server running on port: ${port}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error.message);
    process.exit(1);
  }
};

initializeApp();
