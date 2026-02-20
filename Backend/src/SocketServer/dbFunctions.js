
import { pool } from "../db/db.js";

export const dbFunctions = {
    fetchFriendsIds:  async (loggedinuserid) => {
      // select receiverids where senderid is me 
      // union   
      // select senderid where recieverid is me
      const [ids] = await pool.execute(`SELECT receiver_id  as id FROM messages WHERE sender_id=? UNION SELECT sender_id as id FROM messages WHERE receiver_id=?`, [loggedinuserid, loggedinuserid]) ;
      // console.log(ids);
      // console.log(ids); //[ { id: 1 }, { id: 3 }, { id: 2 }, { id: 4 } ]
      //the ids is an array consisting of objects.. like [{id:1}, {id: 4}, {id: 9}]... but in operator expects array of ids and not objects.
      //so... transform it to array of ids 
      if (ids.length === 0) {
        return ids; //may be it will return []
      }
      if (ids.length !== 0) {
        const result = ids.map(element => element.id); //[1, 2, 4, 5]
        return result;
      }
      
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
        // console.log('friendDetails of db result: ', friendDetails)
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
    },
    getFriendByName: async(name, loggedinuserid) => {
      //fetch all the users... from the users table
      // select id, username from users Where username LIKE ? AND id <> ? Limit 10
      const [result] = await pool.execute(`SELECT id, username FROM users WHERE username LIKE ? AND id <> ? LIMIT 10`,[`%${name}%`, loggedinuserid])
// select username as friendName from users where username LIKE %name%
      // console.log('result from db request: ', result); //[ { id: 2, username: 'rohan' } ]
      // return result
      return result;
    }
}



