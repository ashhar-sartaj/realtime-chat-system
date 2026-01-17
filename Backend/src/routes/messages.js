import express from 'express'
import { pool } from '../db/db.js';
import { dbFunctions } from '../SocketServer/dbFunctions.js';
import { messageServices } from '../messageServices/messageservice.js';
const router = express.Router(); //all these routes are protected-- and access after token verfication middleware

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
  // console.log('backened received:', {
  //   senderId,
  //   loggedinuserid
  // })
  const response = await messageServices.updatePending(senderId, loggedinuserid)
  return res.json(response);
})



export default router;