//flow of socket request... from frontnend to backeend.
/**
 * on frontend: const socket = io('/', {headers: {authorization: 302902}})
 * socket.on('connect', ()=>{})
 *  all request to io('/', {headers: {authorization: 302902}}) are intercepted here: const io = new Server(httpServer) in index.js and flow pass to initialiseSocketIO(io), thus runnign initialiseSocket() function => where socket request is authenticated and then finally io.on('connection runs)
 */
import { authenticateSocket } from "../middleware/midlewre.js"
import {messageServices} from '../messageServices/messageservice.js'
const users = {};
const generateRoom = (id1, id2) => {
    return `private_${Math.min(id1,id2)}_${Math.max(id1,id2)}}`
}
export const initialiseSocketIO = (io) => {
    io.use(authenticateSocket);
    io.on('connection', (socket) => {
        console.log('server established connection with client successfully. ', socket.id);
        // console.log('userID: ', socket.userID)
        if (!users[socket.userID]) {
            users[socket.userID] = socket.id;
        }
        //in the below code at line 22, send the keys as integer.. and it is sending string
        const allOnlineUsers = Object.keys(users).map((id) => parseInt(id));
        // console.log(allOnlineUsers); //[1]
        socket.emit('onlineUsers', allOnlineUsers);
        socket.broadcast.emit('userOnline', socket.userID);
        // 1. Send ALL currently online users to NEW connection
        // socket.emit('userOnline', Object.keys(users));
        //now server should emit an event transporting the users as it has just updated/a new user was added.
        // socket.broadcast.emit() relaease the event to everyone cnnected, expect the socket itself. 
        // socket.broadcast.emit('userOnline', socket.userID)

        const userID = socket.userID;
        socket.on('private-message', async (data, clientAck) => {
            const {from, to, message} = data;
            console.log('message received from frontend: ', message);
            //first validate to/receiver... dont validate friendId as if the loggedinuser search a new friend... and when it sends a new message to the searched friend, so the message wont be sent as the searched frind's id is not fetched from db (as to friend id validation passes only if when have that id as a friend in our database.. but before even we send a message to that seached friend, he/she is not considered as a friedn.)
            
            /**const friendIds = await messageServices.friendids(socket.userID);
            console.log('friend ids fetched from db')
            if (!friendIds.includes(to)) {
                //means if my friendIds does not include to
                console.log('invalid receiver id');
                return;
            }
            console.log('friend ids validated.')**/
            //now move to validate message.
            if (message.trim().length === 0) {
                console.log('message provided is invalid');
                return;
            }
            //finally save the message to db.
            const result = await messageServices.createMessage(socket.userID, to, message);//whole [result] is a response from db Function
            console.log('result of first msg save: ', result);
            const isValid = result && result.affectedRows === 1 && typeof result.insertId === 'number' && result.insertId > 0;
            if (!isValid) {
                console.log('error is first save of msg to db.')
            }
            //means isValid is true. 
            console.log('message successfully saved to db.')
            //below sending the client ack for 'private-message' event
            if (clientAck) clientAck({status: 'ok', message: `message successfully saved to db: ${result.insertId}`});
            //now on client side get the insertId of the record from above clientAck and then emit event by name: emitToRoom and then listen that on server
            const savedmessage = await messageServices.fetchMessage(result.insertId);
            console.log('saved message is: ', savedmessage);
            //now check if receiver is online, if yes, emit message to room
            if (users[to]) { //if users does not have to(means if rohan and krishna are online... taking to each other, and now when rohan sent message to ashhar(to), ashhar is not online... then, just emit the message to sender so that its ui can be updated, and save the message to db with broadcasted_at, delivered_at null and seen at null. )
                //first argument: senderId second argument: receiverId
                const room = generateRoom(userID, to);
                const userSocketId = users[userID];
                const userSocket = io.sockets.sockets.get(userSocketId);
                userSocket.join(room); 
                // this i have added just now. for sender to join room.
                //now get the receiver socket and make it join the room
                //implent: whenevr you refresh the page, it should log out
                const receiverSocketId = users[to];
                const receiverSocket = io.sockets.sockets.get(receiverSocketId);
                receiverSocket.join(room);
                io.to(room).emit('receiveMessageReceiverOnline',{from: from , to: to, message: savedmessage})
            } else {
                socket.emit('receiveMessageReceiverOffline', savedmessage);
            }

            socket.on('messageReadReceiverOnline', async (data) => {//here, just get from frontend the selecteduser id... if selected userid is same as from-- means status must be seen, otherwise the message is unread.
                    const {messageId} = data;
                    console.log("messageId is: ",messageId);
                    console.log("result.insertId: ",result.insertId);
                    if (result.insertId === messageId) {
                        //means messageId is valid-- now update message seen. followings will be set: broadcasted_at, delivered_at, seen_at, status as seen,
                        const rowsAffected = await messageServices.updateMessageSeen(from, to,  result.insertId);
                        console.log('rows affected: ', rowsAffected);
                        if (rowsAffected === 1) {
                        console.log('updateSeen fn: success')
                        } else {
                        console.log('updateSeen fn: failed')
                        }
                    }
                })
                
                socket.on('messageUnreadReceiverOnline', async (data)=>{
                    const {messageId} = data;
                    console.log("messageId is: ",messageId);
                    console.log("result.insertId: ",result.insertId);
                    if (result.insertId === messageId) {
                        //means messageId is valid-- now update message delivered. followings will be set: broadcasted_at, delivered_at, status as delivered,
                        const rowsAffected = await messageServices.updateMessageDelivered(from, to, result.insertId);
                        console.log('rows affected: ', rowsAffected);
                        if (rowsAffected === 1) {
                        console.log('updateDelivered fn: success')
                        } else {
                        console.log('updateelivered fn: failed')
                        }
                    }
                })
        })
        
        //handling client disconnect
        socket.on('disconnect', ()=>{
            // console.log('below is disconnect callback:')
            // callback && console.log('consoling callback: ',callback);
            if (socket.userID && users[socket.userID]) {
                //fiallly, deleting this socket
                    delete users[socket.userID];  //Clean when the user disconnect
                io.emit('userOffline', userID);
                    console.log(`User ${socket.userID} disconnected, cleaned from users, having socket id: `, socket.id);
                }
        });
        //handling server side error event
        socket.on('error', (error)=> {
            console.error('Server error event : ',error.message)
        })
    })
    io.on('error', (err) => {
        console.log('error event from server side', err);
    })

}