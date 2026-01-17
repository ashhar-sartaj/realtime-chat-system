
import { pool } from "../db/db.js";

export const dbFunctions = {
    fetchFriendsIds:  async (loggedinuserid) => {
      // select receiverids where senderid is me 
      // union   
      // select senderid where recieverid is me
      const [ids] = await pool.execute(`SELECT receiver_id  as id FROM messages WHERE sender_id=? UNION SELECT sender_id as id FROM messages WHERE receiver_id=?`, [loggedinuserid, loggedinuserid]) ;
      // console.log(ids); //[ { id: 1 }, { id: 3 }, { id: 2 }, { id: 4 } ]
      //the ids is an array consisting of objects.. like [{id:1}, {id: 4}, {id: 9}]... but in operator expects array of ids and not objects.
      //so... transform it to array of ids 
      const result = ids.map(element => element.id); //[1, 2, 4, 5]
      return result;
    },
    allChatsFromIds: async (loggedinuserid, friendIds) => {
      const placeholder = friendIds.map(() => '?').join(',');
      const [messages] = await pool.execute(`SELECT * FROM messages WHERE (receiver_id=? AND sender_id IN (${placeholder})) OR (sender_id=? AND receiver_id IN(${placeholder})) ORDER BY created_at ASC`,[loggedinuserid, ...friendIds, loggedinuserid, ...friendIds]);
      return messages;
    },
    myFriendsDetails: async (friendIds) => {
      //fetch username from user table where id in (friendids);
      if(friendIds.length !== 0) {
        const placeholder = friendIds.map(() => '?').join(',');
        const [friendDetails] = await pool.execute(`SELECT id, username FROM users WHERE id IN (${placeholder})`, [...friendIds]);
        return friendDetails; //[{id, username}, {id, username}]
      }
      
    },
    insertMessage: async (senderId, receiverId, message) => {
      // const placeholder = arr.map(() => '?').join(',');
      const [result] = await pool.execute(`INSERT INTO messages(sender_id, receiver_id, message, created_at, status) VALUES (?, ?, ?, UTC_TIMESTAMP(), ?)`, [senderId, receiverId, message,'sent']);
      // return result.insertId;
      return result;
    },
    getMessage: async (insertid) => {
      const [result] = await pool.execute('SELECT * FROM messages WHERE id=?',[insertid]);
      return result[0];
    },
    
    updateDeliveredNull: async (insertid) => {
    const [result] = await pool.execute(`UPDATE messages SET broadcasted_at = UTC_TIMESTAMP() WHERE broadcasted_at IS NULL AND delivered_at IS NULL AND status=? AND id = ?`,['sent', insertid]);
    return result.affectedRows;
    },
    getUnreads: async(loggedinuserid) => {
      const [result] = await pool.execute(`SELECT sender_id, COUNT(*) as unread_count FROM messages WHERE receiver_id=? AND broadcasted_at IS NOT NULL  AND status=?  GROUP BY sender_id`,[loggedinuserid, 'delivered']);
      return result;
    },
    updateDelivered: async (senderId, receiverId, insertid) => {
      const [result] = await pool.execute(`UPDATE messages SET broadcasted_at = UTC_TIMESTAMP(), delivered_at = UTC_TIMESTAMP(), status = ? WHERE broadcasted_at IS NULL AND delivered_at IS NULL AND sender_id=? AND receiver_id=? AND id = ? AND status = ?`,['delivered', senderId, receiverId, insertid, 'sent'])
      return result.affectedRows;
    },
    updateSeen: async (senderId, receiverId, insertid) => {  //update messages SET broadcasted_at = UTC_TIMESTAMP(), delivered_at = UTC_TIMESTAMP(), seen_at=UTC_TIMESTAMP(), status=? WHERE broadcasted_at IS NULL AND delivered_at IS NULL AND seen_at IS NULL AND id=? AND status=?
      const [result] = await pool.execute(`update messages SET broadcasted_at = UTC_TIMESTAMP(), delivered_at = UTC_TIMESTAMP(), seen_at=UTC_TIMESTAMP(), status=? WHERE broadcasted_at IS NULL AND delivered_at IS NULL AND seen_at IS NULL AND sender_id=? AND receiver_id=? AND id=? AND status=?`,['seen', senderId, receiverId, insertid, 'sent'])
      return result.affectedRows;
    },
    updateUnreads: async (senderid, receiverid) => {
      const [result] = await pool.execute(`UPDATE messages SET seen_at = UTC_TIMESTAMP(), status=? WHERE broadcasted_at IS NOT NULL AND delivered_at IS NOT NULL AND seen_at IS NULL AND status=? AND sender_id=? AND receiver_id=?`,['seen', 'delivered', senderid, receiverid])
      return result.affectedRows;
    },
    updatePending: async (senderid, receiverid) => {
      const [result] = await pool.execute(`UPDATE messages SET broadcasted_at=UTC_TIMESTAMP(), delivered_at=UTC_TIMESTAMP(), seen_at = UTC_TIMESTAMP(), status=? WHERE broadcasted_at IS NULL AND delivered_at IS NULL AND seen_at IS NULL AND status=? AND sender_id=? AND receiver_id=?`,['seen', 'sent' , senderid, receiverid])
      return result.affectedRows;
    },
    getPending: async (loggedinuserid) => {
      const [result] = await pool.execute(`SELECT sender_id, COUNT(*) as pending_count FROM messages WHERE receiver_id=? AND broadcasted_at IS NULL AND status=? GROUP BY sender_id`,[loggedinuserid, 'sent'])
      return result;
    }
}
const insertRecords  = async () => {
    const time=new Date(); //js time.. in UTC internally
    const message='hey, rohan, ashhar this side!';
    const [result] = await pool.execute('INSERT INTO messages(sender_id, receiver_id, message, created_at, broadcasted_at, status) VALUES(?, ?, ?, ?, ?, ?)',[1, 2, message, time, time, 'sent']);
    console.log(result);
    /*
    ResultSetHeader {
  fieldCount: 0,
  affectedRows: 1,
  insertId: 15,
  info: '',
  serverStatus: 2,
  fieldCount: 0,
  affectedRows: 1,
  insertId: 15,
  info: '',
  serverStatus: 2,
  warningStatus: 0,
  changedRows: 0
}





  fieldCount: 0,
  affectedRows: 1,
  insertId: 15,
  info: '',
  serverStatus: 2,
  warningStatus: 0,
  changedRows: 0
}


  fieldCount: 0,
  affectedRows: 1,
  insertId: 15,
  info: '',
  serverStatus: 2,
  warningStatus: 0,
  changedRows: 0
}
  fieldCount: 0,
  affectedRows: 1,
  insertId: 15,
  info: '',
  serverStatus: 2,
  affectedRows: 1,
  insertId: 15,
  info: '',
  serverStatus: 2,
  info: '',
  serverStatus: 2,
  serverStatus: 2,
  warningStatus: 0,
  changedRows: 0
}
    */ 
}
// insertRecords();
const getMessage = async (id) => {
    //get message based on insertId
    const [result] = await pool.execute('SELECT * FROM messages WHERE id=?',[id]);
    console.log(result);
    /*
        [
        {
            id: 15,
            sender_id: 1,
            receiver_id: 2,
            message: 'hey, rohan, ashhar this side!',
            created_at: 2025-12-17T09:22:51.000Z,
            broadcasted_at: 2025-12-17T09:22:51.000Z,
            delivered_at: null,
            seen_at: null,
            status: 'sent'
        }
        ]
    */ 
}
// getMessage(15);
// const updateMessage = () => {
//     //
// }

const selectMsg = async () => {
const [result] = await pool.execute('SELECT * FROM messages WHERE delivered_at IS NULL'); 

const {...sender} = result[0];
console.log(sender.sender_id);
//i want an array that should contains all the ids returned from the result .
const ids = result.map((...m) => m.id);
const idss = result.map((m) => m.id);
console.log(ids);
console.log(idss);
}
// selectMsg();
//functions to fetch pendign messages: 2 kinds of pending messages:those having broascasted_at(filled) & status as sent as well as broadcasted_at( not filled) & status as sent
export const fetchMsgHavingBrNullStatSent = async (loggedinuserid) => {
  const [MsgHavingBrNullStatSent] = await pool.execute('SELECT * FROM messages WHERE broadcasted_at IS NULL AND status=? HAVING id=?',['sent', loggedinuserid]);
  return MsgHavingBrNullStatSent;
}
export const fetchMsgHavingBrNotNullStatSent = async (loggedinuserid) => {
  const [MsgHavingBrNotNullStatSent] =  await pool.execute('SELECT * FROM messages WHERE broadcasted_at IS NOT NULL AND status=? HAVING id=?',['sent', loggedinuserid,]);
  return MsgHavingBrNotNullStatSent;
}

//fetching my friends: should get the ids where i have chatted utually as well as  first timer. 


// const ans = await fetchFriendsIds(5);
// console.log(ans); //[ 1, 3, 2, 4 ]

//get messages from all these 
const messagesFromFriends = async (friendIds, loggedinuserid) => {
  if (friendIds.length == 0) return;
  //we have to create placeholders for input friendIds
  const placeholder = friendIds.map(() => '?').join(',')
  
  // select * from messages where receiver_id=me AND sender_id IN (friendIds) OR select * from messages where sender_id=me AND receiver_id IN (friendIds)
  const [messages] = await pool.execute(`select * from messages WHERE (receiver_id=? AND sender_id IN (${placeholder})) OR (sender_id=? AND receiver_id IN (${placeholder}))`, [loggedinuserid, ...friendIds, loggedinuserid, ...friendIds]);
  console.log(messages); //
}
// messagesFromFriends(ans, 5);
// ans: [1, 3, 2, 4]


// roi na , sitaare 
//now that we got the messages from our friends segregating them/grouping them.
//creating a map, where key will be the other user wrt loggedin user.
//loop through the returned results... 
// const loggedinuserid = socket .userID;
// const map = new Map();
// for (const message of messagesFromFriends) {
//   // key of map will be named as otheruserid. 
//   const otheruserid = message.sender_id === loggedinuserid ? receiver_id : sender_id 
//   //checking if map already contains otheruser as key.. if no, initialise key with value as empty array, if yes, just push message in already created array.
//   if (!map.has(otheruserid)) {
//     map.set(otheruserid, []);
//   }
//   map.get(otheruserid).push(message);
// }

//function that would create a map of conversation with friends
const mapOfConvoWithFriends = async (loggedinuserid) => {
  //getting the ids of friends 
  const fetchFriendsIds =  async (loggedinuserid) => {
    // select receiverids where senderid is me 
    // union   
    // select senderid where recieverid is me
    const [ids] = await pool.execute('SELECT receiver_id  as id FROM messages WHERE sender_id=? UNION SELECT sender_id as id FROM messages WHERE receiver_id=?', [loggedinuserid, loggedinuserid]) ;
    const result = ids.map(element => element.id);
    return result;
  }
  const idsOfFriends = await fetchFriendsIds(loggedinuserid);


  //getting entire conversation related to ids
  const messagesFromFriends = async (friendIds, loggedinuserid) => {
    if (friendIds.length == 0) return;
    //we have to create placeholders for input friendIds
    const placeholder = friendIds.map(() => '?').join(',')
    const [messages] = await pool.execute(`select * from messages WHERE (receiver_id=? AND sender_id IN (${placeholder})) OR (sender_id=? AND receiver_id IN (${placeholder}))`, [loggedinuserid, ...friendIds, loggedinuserid, ...friendIds]);
    // console.log(messages); 
    return messages;
  }
  const chatHistory = await messagesFromFriends(idsOfFriends, loggedinuserid);

  //creating map, that will record all conversation history with these friends
  const map = new Map();
  for (const message of chatHistory) {
    // key of map will be named as otheruserid. 
    const otheruserid = message.sender_id === loggedinuserid ? message.receiver_id : message.sender_id 
    //checking if map already contains otheruser as key.. if no, initialise key with value as empty array, if yes, just push message in already created array.
      if (!map.has(otheruserid)) {
          map.set(otheruserid, []);
      }
    map.get(otheruserid).push(message);
  }
  return map;
}
// const mapOfChatsWithFriends = await mapOfConvoWithFriends(5);
// console.log(mapOfChatsWithFriends);

//since, the loggedin user is of userID: 5.
// creating an Array or map where key is sender id with values as [no. of pendingMessages].apply.apply. by filtering out the pending messages.
const pendingMap = new Map();

// for (const [friendId, messages] of mapOfChatsWithFriends) {
//   for (const chat of messages) {
//     if(chat.receiver_id===5 && chat.status === 'sent') {
//       if(!pendingMap.has(chat.sender_id)) {
//         pendingMap.set(chat.sender_id, {count: 0, messages: []});
//       }
//     const entry = pendingMap.get(chat.sender_id);
//     entry.messages.push(chat);
//     entry.count++;
//     }
//   }
// }


// for (const chat of mapOfChatsWithFriends) {
//   if(chat.receiver_id===5 && chat.status === 'sent') {
//     if(!pendingMap.has(chat.sender_id)) {
//       pendingMap.set(chat.sender_id, {count: 0, messages: []});
//     }
//     const entry = pendingMap.get(chat.sender_id);
//     entry.messages.push(chat);
//     entry.count++;
//   }
// }
// console.log(pendingMap);
/**
 * 
 * Map(3) {
  4 => { count: 1, messages: [ [Object] ] },
  1 => { count: 2, messages: [ [Object], [Object] ] },
  3 => { count: 1, messages: [ [Object] ] }
}

 */

//now sending this map to frontend. 











