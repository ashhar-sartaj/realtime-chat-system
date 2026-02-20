import {dbFunctions} from '../SocketServer/dbFunctions.js'
export const messageServices = {
    //createMessage will call db create function. this createmessage function must be used for both socket as well as http request (in case we add later)
    createMessage: async (senderId, receiverId, message) => {
        const response = await dbFunctions.insertMessage(senderId, receiverId, message);
        return response;
    },
    friendids: async (id) => {
        const response = await dbFunctions.fetchFriendsIds(id);
        return response;
    },
    fetchMessage: async (id) => {
        const response= await dbFunctions.getMessage(id);
        return response;
    },
    updateMessageDeliveredNull: async (id) => {
        const response = await dbFunctions.updateDeliveredNull(id);
        return response;
    },
    updateMessageDelivered: async (senderId, receiverId, msgId) => {
        const response = await dbFunctions.updateDelivered(senderId, receiverId, msgId);
        return response;
    },
    updateMessageSeen: async (senderId, receiverId, msgId) => {
        const response = await dbFunctions.updateSeen(senderId, receiverId, msgId); 
        return response;
    },
    updateUnread: async (senderid, receiverid) => {
        const response = await dbFunctions.updateUnreads(senderid, receiverid)
        return response;
    },
    updatePending: async (senderid, receiverid) => {
        const response = await dbFunctions.updatePending(senderid, receiverid)
        return response;
    },
    unreads: async (id) => {
        const response = await dbFunctions.getUnreads(id);
        return response;
    },
    pending: async (id) => {
        const response = await dbFunctions.getPending(id);
        return response;
    },
    fetchSearchFriend: async (name, loggedinuserid) => {
        const response = await dbFunctions.getFriendByName(name, loggedinuserid);
        // console.log(response);
        return response;
    }
}