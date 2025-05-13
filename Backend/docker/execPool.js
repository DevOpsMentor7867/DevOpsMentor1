//execpool
const Docker = require('dockerode');

class ExecInstancePool {
  constructor(size) {
    this.size = size; 
    this.pool = [];    
    this.dockerClient = new Docker(); 
  }

  
  initialize = async () => {
    for (let i = 0; i < this.size; i++) {
      const execInstance = await this.createExecInstance(); 
      this.pool.push(execInstance);
    }
    console.log(`ExecInstance pool initialized with ${this.size} instances.`);
  }

  
  createExecInstance = async () => {
    const execInstance = await this.dockerClient.createExec({
      Cmd: ['/bin/bash'],   
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
    });
    return execInstance;
  }

  
  borrowExecInstance = async () => {
    if (this.pool.length > 0) {
      return this.pool.pop(); 
    } else {
      console.log("No available execInstances in the pool. Creating a new one.");
      return await this.createExecInstance(); 
    }
  }

  
  returnExecInstance = (execInstance) => {
    this.pool.push(execInstance); 
  }

  
  async close() {
    this.pool = [];
    console.log("All execInstances have been closed.");
  }
}


const execInstancePool = new ExecInstancePool(2);


//execInstancePool.initialize();

module.exports = execInstancePool;
