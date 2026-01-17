import express from 'express'
import { pool } from '../db/db.js';
import { dbFunctions } from '../SocketServer/dbFunctions.js';
import { messageServices } from '../messageServices/messageservice.js';

const router = express.Router(); //all these routes are protected-- and access after token verfication middleware
router.get('/user', async (req, res) => {
    // quering the database and fetchng all the users apart from this user. //the below 'ORDER BY created_at DESC LIMIT 20' will fetch the recent 20
    const [rows] = await pool.execute('SELECT id, username FROM users WHERE id !=? ORDER BY created_at DESC LIMIT 20', [req.id]); //rows is an array of obj.. each obj represents individual user
    //empty users = OK
    if (rows.length === 0) {
        //means no records are there
        return res.status(200).json([]);
    }
    const greeting = `Hello ${req.user}! This is your dashboard.`
    return res.json({dbUsers: rows, message: greeting, dashboardOwner: `${req.user}`, dashboardOwnerId: `${req.id}`});
}) 
// router.get('/myfriends', async (req, res) => {
//   //i have to select only those entries(names) from db that have communcated with the loggeedin user  atleast once. This comm can be mutual or one sided.
//   //frst i will extract ids of my friends from messages table and then inner join with the users table to get their username.
//   const friendIds = await dbFunctions.fetchFriendsIds(req.id) //[1, 2, 3, 4]
//   //executing the beolow sql cmmand only if length of ids array is not 0.
//   if(friendIds.length !== 0) {
//     //now fetch friends username from user table.
//     const friendsDetails = await dbFunctions.myFriendsDetails(friendIds);
//     // console.log(friendsDetails);
//     //now fetch all the messages from these friendIds.
//     const messages = await dbFunctions.allChatsFromIds(req.id, friendIds);
//     // console.log(messages); //it is an array containing objects representing messages with above ids. Now, grouping these messages by ids in frontend. 
//     return res.status(200).json({friendsDetails: friendsDetails, messages: messages});
//   } 
//   //below line will only execute if friendsids length is 0.. so return just an empty array.
//   return res.json([]);
// })

// request to get loggedinuser friends
router.get('/myfriends', async  (req, res) => {
const friendIds = await dbFunctions.fetchFriendsIds(req.id); //\[7, 6, 4, 1];
  if (friendIds.length !== 0) {
    const friendsDetails = await dbFunctions.myFriendsDetails(friendIds); ;// \[{id:, username}, {id:, username}];
    return res.json(friendsDetails);
  }
})
router.get('/unreads', async (req, res) => {
  const unreadCount = await messageServices.unreads(req.id);
  return res.json(unreadCount);
})
router.get('/pending', async (req, res) => {
  const pendingCount = await messageServices.pending(req.id);
  return res.json(pendingCount);
})
router.get('/chats', async (req, res) => {
//first get the friendIds
const friendIds = await dbFunctions.fetchFriendsIds(req.id); //\[7, 6, 4, 1];
  if(friendIds !== 0) {
    const messages = await dbFunctions.allChatsFromIds(req.id, friendIds);
    return res.json(messages);
  }
})

//endpoint to fetch the details of loggedin user
router.get('/loggedinuser', (req, res) => {
  //since this request to '/api/auth/msg/loggedinuser' will be first authenticated by middleware. So, we have properties attached to request object.
  const id = req.id;
  const username  = req.user;
  return res.status(200).json({id: id, username: username});

})
//endpoint to insert messages in db
router.post('/insertMsg', async (req, res) => {
  const {senderId,  receiverId, message} = req.body;
  //call the craeteMessage function from messageServices and put req.body as parameter. That function accepts senderId, receiverId, message.
  const response = await dbFunctions.insertMessage(senderId, receiverId, message)
  return res.json({success: true , insertId: response.insertID})
})
//endpoint to update unreads in db
router.post('/updateunreads', async (req, res) => {
  const { senderId, loggedinuserid } = req.body;
  // console.log('backened received:', {
  //   senderId,
  //   loggedinuserid
  // })
  const response = await messageServices.updateUnread(senderId, loggedinuserid)
  return res.json(response);
})
//endpoint to update pending in db
router.post('/updatepending', async (req, res) => {
  const { senderId, loggedinuserid } = req.body;
  console.log('backened received:', {
    senderId,
    loggedinuserid
  })
  const response = await messageServices.updatePending(senderId, loggedinuserid)
  return res.json(response);
})

//dummy query -- for db experimentation  
//below route will query all our pending messages for loggedin user-- params just for testing query. Else it will come from frontent
router.get('/pending/:loggeduserid', async (req, res) => {
    const loggedUserId = req.params.loggeduserid
    //getting message that are pending for delivery 
    const [rows] = await pool.execute('SELECT * FROM messages WHERE receiver_id=? AND status=?',[loggedUserId, 'sent']);
    console.log(rows);

    /**
     * [
  {
    id: 5,
    sender_id: 4,
    receiver_id: 5,
    message: 'krishna, are you coming tomorrow?',
    created_at: 2025-12-15T01:15:30.000Z,
    id: 5,
    sender_id: 4,
    receiver_id: 5,
    message: 'krishna, are you coming tomorrow?',
    created_at: 2025-12-15T01:15:30.000Z,
    broadcasted_at: 2025-12-15T01:15:30.000Z,
    delivered_at: null,
    seen_at: null,
    status: 'sent'
  }
    id: 5,
    sender_id: 4,
    receiver_id: 5,
    message: 'krishna, are you coming tomorrow?',
    created_at: 2025-12-15T01:15:30.000Z,
    broadcasted_at: 2025-12-15T01:15:30.000Z,
    receiver_id: 5,
    message: 'krishna, are you coming tomorrow?',
    created_at: 2025-12-15T01:15:30.000Z,
    created_at: 2025-12-15T01:15:30.000Z,
    broadcasted_at: 2025-12-15T01:15:30.000Z,
    delivered_at: null,
    seen_at: null,
    status: 'sent'
  }
]
     */
})
//fetching our chat history partners. there can be mutually chat partners or first time chat initiators as well. 
router.get('/friends/:id', async (req, res) => {
    const ourId=req.params.id;
    // Actual query is:
    // await pool.execute('SELECT DISTINCT receiver_id  FROM messages  WHERE sender_id=? UNION SELECT DISTICT sender_id FROM messages  WHERE receiver_id=?',[socket.userID, socket.userID])
    const [rows] = await pool.execute('SELECT DISTINCT receiver_id as id FROM messages  WHERE sender_id=? UNION SELECT DISTINCT sender_id as id FROM messages  WHERE receiver_id=?',[ourId, ourId]);
    console.log(rows);
    //better syntactically way to write this query is: 'SELECT DISTINCT receiver_id as id FROM messages  WHERE sender_id=? UNION SELECT DISTINCT sender_id as id FROM messages  WHERE receiver_id=?',[socket.userID, socket.userID]
    /* my distinct receiver ids where i was the senderid were: 1, 3 my distinct senderids where i was the receiver were: 2, 4, 1, 3 So, union of them becomes: 2,4, 1, 3
      [ { id: 1 }, { id: 3 }, { id: 2 }, { id: 4 } ]
    */
   console.log(typeof(rows[0].id)); //number
})


export default router;