//contains http server and socket.io server 
import app from "./app.js";
import http from 'http';
import { Server } from "socket.io";
import { initialiseSocketIO } from "./SocketServer/server.js";
import dotenv from 'dotenv'
dotenv.config();
const httpServer = http.createServer(app);//wrapping express app in http server
//here, http socket request gets upgrades to ws request. //io is an instance of Socket.io Server class. thus, your Socket.io server attached to your http server.
const io = new Server(httpServer, {
    cors: {
        origin: (origin, callback) => {

            if (!origin) return callback(null, true);

            if (
                origin === "http://localhost:5173" ||
                origin.endsWith(".netlify.app")
            ) {
                return callback(null, true);
            }

            callback(new Error("Not allowed by CORS"));
        },
        credentials: true
    }
});
initialiseSocketIO(io); 
const port = process.env.PORT||5000;
httpServer.listen(port, () => {
    console.log('Server is running on port ', port);
})