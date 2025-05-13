//const { Pool } = require('generic-pool');
const Docker = require('dockerode');

class DockerClientPool {
  constructor(size) {
    this.size = size; 
    this.pool = [];
  }

  
  initialize = async () => {
    for (let i = 0; i < this.size; i++) {
      const dockerClient = new Docker(); 
      this.pool.push(dockerClient);
    }

    console.log(`Docker pool initialized with ${this.size} clients.`);
  }

  
  borrowClient = async () => {
    if (this.pool.length > 0) {
      return this.pool.pop();  
    } else {
      console.log("No available Docker clients in the pool. Creating a new one.");
      const dockerClient = new Docker(); 
      return dockerClient;
    }
  }

  
  returnClient = (dockerClient) => {
    this.pool.push(dockerClient);
  }


  async close() {
    this.pool = [];
    console.log("All Docker clients have been closed.");
  }
}

const dockerClientPool = new DockerClientPool(2);

module.exports = dockerClientPool;
