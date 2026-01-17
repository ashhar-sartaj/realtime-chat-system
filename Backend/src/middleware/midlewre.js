//in this we will define the code for generating jwt token and other routes middleware
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
// import { store } from '../data/handleUsers.js';
dotenv.config();
const JWT_SECRET=process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}

//fnction to generat jwt 
export const generateJWT = (id, username)=>{
    // console.log("JWT_SECRET ", JWT_SECRET);
    // console.log("entered in generateJWT fn.")
    try {
        const payload = {
            id: id,
            username: username,
        }
        const token = jwt.sign(payload,JWT_SECRET);
        // console.log("just left generateJWT fn.")
        return token;
    } catch(err) {
        console.error("Error generating token:", err);
        throw err;
    }
    
}
export const authenticateToken = (req, res, next) => {
    //getting the token from the headers
    const authHeaders = req.headers['authorization'];
    const token = authHeaders && authHeaders.split(' ')[1];
    // console.log('token from middleware: ', token)
    if (!token) {
        return res.status(401).json({message: 'Unauthorized: token missing/invalid'});
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if(err) {
            return res.status(401).json({message: err.message});
        }
        // console.log('User is the authenticateToken middleware is: ',user);
        req.user = user.username;
        req.id = user.id;
        next();
    })
}

export const authenticateSocket = async (socket, next) => { //this will authenticate the incoming connection, which is socket
    console.log('socket middleware auth attempt.')
    //fetching the token from socket.handshake
    const token = socket.handshake.auth.token;  //take a note how and where we will attach the token while trying to establish socket connection.. as here, the attached token is being fetched 
    // const token = socket.handshake.headers.authorization;
    if(!token) {
        //setting new error
        const err = new Error('Unauthorized socket authentication: token missing/invalid');
        console.log('Socket authentication failed: ', err.message);
        next(err);
    }
    // console.log('consoling socket: ',socket);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => { //this user contains our payload of jwt. 
        if (err) {
            console.log(err.message);
            next(err.message);
        }
        console.log("consoling user: ", user);  //consoling user:  { id: 5, username: 'krishna', iat: 1765381756 }
        //appending our own custom properties in the socket object for our future implementation. 
        socket.userID = user.id; //this userID is from the payload that we sent while jwt.sign.
        socket.user = user.username;//this user is from the payload that we sent while jwt.sign
        socket.userData = user; //providing entire payload. 
    })
    console.log('socket middleware auth passed!')
    next(); //make sure you mention next();;;; it took an entire day of you to figure this out!!!
}