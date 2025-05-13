// redis/redis-server.js
const redis = require('redis');

class RedisClientPool {
  constructor(size) {
    this.size = size; 
    this.pool = [];
  }

  initialize= async() =>{
    for (let i = 0; i < this.size; i++) {
      const client = redis.createClient({
        url: 'redis://127.0.0.1:6379',
        socket: {
          connectTimeout: 10000 
        }
      });

      await client.connect();
      this.pool.push(client);
    }

    console.log(`Redis pool initialized with ${this.size} clients.`);
  }

  
   borrowClient = async() => {
    if (this.pool.length > 0) {
      return this.pool.pop();  
    } else {
      
      console.log("No available Redis clients in the pool. Creating a new one.");
      const client = redis.createClient({
        url: 'redis://127.0.0.1:6379',
        socket: {
          connectTimeout: 10000
        }
      });
      await client.connect();
      return client;
    }
  }

  
  returnClient =(client) => {
    this.pool.push(client);
  }

  
  async close() {
    for (const client of this.pool) {
      await client.quit();
    }
    this.pool = [];
    console.log("All Redis clients have been closed.");
  }
}


const redisClientPool = new RedisClientPool(5);

module.exports = redisClientPool;
