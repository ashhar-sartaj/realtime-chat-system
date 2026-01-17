//contains http server and socket.io server 
import app from "./app.js";
import http from 'http';
import { Server } from "socket.io";
import { initialiseSocketIO } from "./SocketServer/server.js";
/*
const httpServer = http.createServer(app); //wrapping express app in http server
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
}); //io is an instance of Socket.io Server class. thus, your Socket.io server attached to your http server.
*/
const httpServer = http.createServer(app);
const io = new Server(httpServer); //here, http socket request gets upgrades to ws request
initialiseSocketIO(io); 
const port = 5000;
httpServer.listen(port, () => {
    console.log('Server is running on port ', port);
})