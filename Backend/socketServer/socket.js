

//sokcet.js 
const { Server } = require('socket.io');

let io;

const setUpSocketServer = async (httpServer) => {
    io = new Server(httpServer, {
        path: '/socket.io',
        cors: {
            origin: "*", // In production, set this to your frontend's URL
            methods: ["GET", "POST"],
            withCredentials:true,
        },
        transports: ['websocket', 'polling'],
        allowEIO3: true, // Enable compatibility with older clients
    });

    console.log("Socket server is running");
 
    
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.IO has not been initialized!');
    }
    return io;
};

module.exports = { setUpSocketServer, getIo };
