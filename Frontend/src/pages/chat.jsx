
import { api } from "../api/axios.js";
import { useEffect } from "react";
import { useState } from "react"
import { io } from 'socket.io-client'
export  function Chat({onLogout}) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState({loggedInUserDetails: true, loggedInFriendsDetails: true, chats: true});
    const [loggedinuserdetails, setLoggedinuserdetails] = useState(null);
    const [error, setError] = useState(null);
    const [loggingout, setLoggingout] = useState(false);
    const [chatsByUser, setChatsByUser] = useState({});
    const [friendsList, setFriendsList] = useState({});
    const [unreadCounts, setUnreadCounts] = useState({}); //initialise with {} to get rid of initial check i.e null[selectedUser.id]
    const [pendingCounts, setPendingCounts] = useState({}); //initialise with {} to get rid of initial check i.e null[selectedUser.id]
    const [selectedUser, setSelectedUser] = useState(null); //track current seletced user. is an object with props id and username.
    const [newMessage, setNewMessage] = useState('');
    const [refreshChats, setRefreshChats] = useState(false);
    const [searchFriend, setSearchfriend] = useState('');
    const [socket, setSocket] = useState(null);
    
    useEffect(() => {
    if (!token) return;

    const newSocket = io(import.meta.env.MODE === 'development'
    ? undefined
    : import.meta.env.VITE_API_BASE_URL, {
        auth: { token },
        reconnection: true
    });

    newSocket.on('connect', () => {
        console.log('Client connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
        console.log('Socket error:', err.message);
    });

    setSocket(newSocket);

    return () => {
        newSocket.disconnect(); //why we cant do like socket?.disconnect()
    };
    }, [token]);
    useEffect(() => {
  //implementing  i need to have a separate useeffect containing scenario where receiver if offline.  this useffect should not be run if selectedUser is null, loggedinuserdetails is null, socket is null
    if (!socket || !loggedinuserdetails, !selectedUser) return; // if selectedUser is null, 
    const receiveMessageHandlerReceiverOffline = (message) => {
      setChatsByUser((prev) => {
        
        const chatHistory = {...prev};
        const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
        if(!chatHistory[otherUser]) {
          chatHistory[otherUser] = []
        }
                    //checking for duplicate message.. if exist. Since chatHistory[otherUser] gets array that contains all messages as individual object. Applying .some() on this array
        const messageExist = chatHistory[otherUser].some(individualMsg => individualMsg.id === message.id)
                    //if messageExist is false, means no message with id as message.is exist already.
        if (!messageExist) {
          chatHistory[otherUser] = [...chatHistory[otherUser], message];
        }
        return chatHistory;
      })
    }
    socket.on('receiveMessageReceiverOffline', receiveMessageHandlerReceiverOffline);
    return () => {
      socket.off('receiveMessageReceiverOffline', receiveMessageHandlerReceiverOffline);
    }
  }, [socket, loggedinuserdetails, selectedUser])
  
  useEffect(() =>{
    //implementing useeffect if receiver is online--- scenario: if selectedUser is null, if selectedUser not null-- here two scenario is selectedUser.id === from, selectedUser.id !== from
    if (!socket || !loggedinuserdetails) return;
    const receiveMessageHandlerReceiverOnline = (data) => {
    const {from , to, message} = data;
      if (selectedUser?.id === from) {
        setChatsByUser((prev) => {
                    const chatHistory = {...prev};
                    const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                    if(!chatHistory[otherUser]) {
                        chatHistory[otherUser] = []
                    }
                    //checking for duplicate message.. if exist. Since chatHistory[otherUser] gets array that contains all messages as individual object. Applying .some() on this array
                    const messageExist = chatHistory[otherUser].some(individualMsg => individualMsg.id === message.id)
                    //if messageExist is false, means no message with id as message.is exist already.
                    if (!messageExist) {
                        chatHistory[otherUser] = [...chatHistory[otherUser], message];
                    }
                    return chatHistory;
                })
                setTimeout(() => {
                     //craete a settimeout (to factor async setChatByUser update), and the emit event with payload as message id
                    // console.log('about to emit messageReadReceiverOnline')
                     socket.emit('messageReadReceiverOnline', {messageId: message.id}) //to update broadcasted_at, deivered_at, seen_at status as seen, senderid is from, receiverid is loggeedinuserid, id is equal to message.id
                }, 100)
      } else if (selectedUser?.id !== from) {
          setChatsByUser((prev) => {
                    const chatHistory = {...prev};
                    const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                    if(!chatHistory[otherUser]) {
                        chatHistory[otherUser] = []
                    }
                    //checking for duplicate message.. if exist. Since chatHistory[otherUser] gets array that contains all messages as individual object. Applying .some() on this array
                    const messageExist = chatHistory[otherUser].some(individualMsg => individualMsg.id === message.id)
                    //if messageExist is false, means no message with id as message.is exist already.
                    if (!messageExist) {
                        chatHistory[otherUser] = [...chatHistory[otherUser], message];
                    }
                    return chatHistory;
                })
                // i have to increase pending count and emit event to uodate the status
                setUnreadCounts((prev) => {
                    return {
                        ...prev,
                        [from]: (prev[from] || 0) + 1
                    }
                })
                setTimeout(()=>{
                    console.log('about to emit messageUnreadReceiverOnline')
                    socket.emit('messageUnreadReceiverOnline', {messageId: message.id});//to update broadcasted_at, delivered_at, status as delivered
                }, 100)
      } else {
        //receiver online but no selectedUser → delivered 
        setChatsByUser((prev) => {
                    const chatHistory = {...prev};
                    const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                    if(!chatHistory[otherUser]) {
                        chatHistory[otherUser] = []
                    }
                    //checking for duplicate message.. if exist. Since chatHistory[otherUser] gets array that contains all messages as individual object. Applying .some() on this array
                    const messageExist = chatHistory[otherUser].some(individualMsg => individualMsg.id === message.id)
                    //if messageExist is false, means no message with id as message.is exist already.
                    if (!messageExist) {
                        chatHistory[otherUser] = [...chatHistory[otherUser], message];
                    }
                    return chatHistory;
                })
                // i have to increase pending count and emit event to uodate the status
                setUnreadCounts((prev) => {
                    return {
                        ...prev,
                        [from]: (prev[from] || 0) + 1
                    }
                })
                setTimeout(()=>{
                    console.log('about to emit messageUnreadReceiverOnline')
                    socket.emit('messageUnreadReceiverOnline', {messageId: message.id});//to update broadcasted_at, delivered_at, status as delivered
                }, 100)
      }
    }
    socket.on('receiveMessageReceiverOnline', receiveMessageHandlerReceiverOnline);
    return () => {
      socket.off('receiveMessageReceiverOnline', receiveMessageHandlerReceiverOnline);
    }
    
  }, [socket, loggedinuserdetails, selectedUser])


    useEffect(() => {
    if (!token) return;
    let isCancelled = false;
    const fetchLoggedinuserDetails = async () => {
        // console.log('before fetching loggedin user',loggedinuserdetails)
        try {
          const info = await api.get('/api/auth/msg/loggedinuser', {headers: {Authorization:`Bearer ${token}`}}) //{id: , username: }
            // console.log("loggedinuserdetails: ",typeof(info.data))
          setLoggedinuserdetails(info.data);
            
        } catch(err) {
          console.log(err)
        } finally {
          if (!isCancelled) {
            //if isCancelled is false then only set the state.
            setLoading(prev => ({...prev, loggedInUserDetails: false}))
          }
          
        }
      }
    const fetchFriendsDetails = async() => {
      try {
        const response = await api.get('/api/auth/msg/myfriends', {headers: {Authorization:`Bearer ${token}`}});
        const friendsDetail = response.data; //[{id: ,  username}, {id, username}, {id, username}]
        setFriendsList(friendsDetail.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {}));
      } catch(err) {
        console.log(err)
      } finally {
        if (!isCancelled) {
          setLoading(prev =>({...prev, loggedInFriendsDetails: false}))
        }
      }
    }
    fetchLoggedinuserDetails();
    fetchFriendsDetails();
      
    return () => {
      isCancelled = true; //since we are using 2 async calls... and if token changes quickely, then our aysnc operations could occur for different token value... so use isCancelled flag to make async call for single token
    }
  }, [token])

  useEffect(()=>{
    //will fetch unread and set the state.
    if (!token) return;
    const fetchUnread = async() => {
        const response = await api.get('/api/auth/msg/unreads', {headers: {Authorization:`Bearer ${token}`}})
        const unreadCountBySender_id = response.data;  //[{…}, {…}, {…}, {…}]
        //[{"sender_id":1,"unread_count":3},{"sender_id":2,"unread_count":33},{"sender_id":3,"unread_count":1},{"sender_id":4,"unread_count":2}]
    
        // const ans = unreadCountBySender_id.reduce((acc, record)=> {
        //     acc[record.sender_id] = record.unread_count;
        //     return acc;
        // }, {})
        // console.log(ans); //{1: 3, 2: 33, 3: 1, 4: 2} the keys represents the sender_id(otheruser) and values are unread count. 
        setUnreadCounts(unreadCountBySender_id.reduce((acc, record)=> {
            acc[record.sender_id] = record.unread_count;
            return acc;
        }, {}));
    }
    fetchUnread()
  }, [token]);
  useEffect(() => {
    if (!token) return;
    const fetchPending = async() => {
        //will fetching pending messages. disticntion betweem unread and pending. pending have broadcasted_at is null whereas unreads have broadcasted_at is not null. 
        const response = await api.get('/api/auth/msg/pending', {headers: {Authorization:`Bearer ${token}`}})
        const pendingCountBySenderId = response.data; //[{"sender_id":2,"pending_count":26}]
        // console.log(pendingCountBySenderId);
        // const ans = pendingCountBySenderId.reduce((acc, record)=> {
        //     acc[record.sender_id] = record.pending_count;
        //     return acc;
        // }, {});
        // console.log(ans);

        setPendingCounts(pendingCountBySenderId.reduce((acc, record)=> {
            acc[record.sender_id] = record.pending_count;
            return acc;
        }, {})); //will convert it to {2: 26} and state of pendingCounts will be set to this.
    }
    fetchPending();

    }, [token])
  //the result of commenting the below code is that all the friends of loggedin user are not showing up in left pane. So, basically in order to implement socket communication.... we need one request to fetch all the friends and their details of loggedin user. 
useEffect(() => {
    if(!token || !loggedinuserdetails) return;
    const fetchChatsByUser = async() => {
        //issue this useeffect is running instead of the one that is listening to 'receiveMessage' event.. so just comment it out to check.
      try {
        const response = await api.get('/api/auth/msg/chats', {headers: {Authorization:`Bearer ${token}`}});
        console.log(response);
        const messages = response.data; //these message are not grouped by other user.
        setChatsByUser(()=> {
          const chatsGroupedByOtherUser = {};
          for (const message of messages) {
            // if (loggedinuserdetails && Object.entries(loggedinuserdetails).length === 0) return;
            const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
            //check if other user already exist
            if(!chatsGroupedByOtherUser[otherUser]) {
                chatsGroupedByOtherUser[otherUser] = [];
            }
            chatsGroupedByOtherUser[otherUser].push(message);
          }
          return chatsGroupedByOtherUser;
        })
      } catch(err) {
        console.log(err)
      } finally {
        setLoading(prev => ({...prev , chats: false}))
      }
    }
    fetchChatsByUser();
    
    //what does chatsByUser looks like: it is an object containg keys as otheruserid (friendsofloggedinuser) and values as array of objects, where each object represents single message by that otheruser to current loggedinuser.
  }, [loggedinuserdetails]); //there should be lggedinuseretails as dependency as the content of this useeffect depends on loggedinuserdetails. So, my chatsbyuser will not set even if loggedinuser changes. It took hrs to fiure this out. 
  //prev deps of above useeffect
  
  //that error of excess setting of otheruser is fixed by adding loggedinuserdetails as dependency here.
  //make change to state of refreshChats when: 1. selectedUser changes 2. loggedin user sends a message
    const handleAuthFailure = () => {
        if(token) localStorage.removeItem('token'); //make sure that you do 'if (token)' and not 'if (!token)'... because token will not be removed as it is still there as you were logged in.
        setToken(null);
        setLoggedinuserdetails(null);
        socket?.disconnect();
        // socket?.setSocket(null); //wrong way to write coz: socket is the state value, not an object with a setSocket method.
        setSocket(null);
        setSelectedUser(null);
        setLoggingout(true);
        setTimeout(()=>{
            onLogout?.(); //sets the authentication to false;
        }, 1000)
    }
    const handleLogout = () => {
        handleAuthFailure();
    }
    // useEffect(()=>{
    //     console.log(friendsList);
    // }, [friendsList])
    // useEffect(() => {
    //     if (Object.keys(pendingCounts).length===0) return;
    //     console.log(pendingCounts)
    // }, [pendingCounts])
    // useEffect(() => {
    //     if(!selectedUser) return;
    //     console.log(selectedUser);
    // }, [selectedUser])
    useEffect(() => {
        if (Object.keys(chatsByUser).length===0) return;
        console.log("chatsByUser: ",chatsByUser)
    }, [chatsByUser]);
    useEffect(() => {
        if (Object.keys(unreadCounts).length === 0) return;
        console.log("unread counts: ",unreadCounts)
    }, [unreadCounts])
    useEffect(() => {
        if (!selectedUser) return;
        console.log("sselected user: ",selectedUser);
    }, [selectedUser])
    useEffect(() => {
        if (Object.keys(friendsList).length=== 0) return;
        console.log("friendList: ",friendsList)
    }, [friendsList])
    //log of friendList state:  {1: {id: 1, username: 'ashhar'}} key is friends id 
    useEffect(() => {
        //check if unreadCount has selecteduser.id, if no, do nothing: return 
        if ( !selectedUser?.id || unreadCounts[selectedUser.id] === undefined || !loggedinuserdetails?.id) {
            return;
        }
        console.log('Safe params:', {
            senderId: selectedUser.id,
            loggedinuserId: loggedinuserdetails.id
        });
        // console.log(selectedUser);
        // console.log(typeof selectedUser.id);
        // console.log(unreadCounts[selectedUser.id])
        // console.log(typeof unreadCounts[selectedUser.id])
        // console.log(loggedinuserdetails)
        // console.log(unreadCounts);
        //if yes, 1. clear the unread count of that selectedUser 2. Accordingly, make updates to those records in db.
        //now finally, create a function requiring two aspects: that otheruserid which is removed (it is from), loggedinuser id (it is to)
        const updateUnreads = async (senderId, loggedinuserid) => { //fromId: unreadCounts[selectedUser.id]
            //parameters of sql query to update unread: are records whose delivery is NOT NULL and status as delivered. to update: seenat,  status as seen WHERE receiver_id is loggedinuser and sender_id is as provided.
            const response = 
            await api.post('/api/auth/msg/updateunreads', { senderId, loggedinuserid },
            { headers: { Authorization: `Bearer ${token}` } }  
            );
            console.log('unread updated in db: ',response.data); //should be 1 if successful update

            //parameters of sql query to update pending : are records whose delivery IS NULL and status is sent.  to update: delivered at status as delivered WHERE  receiver_id is loggedinuser and sender_id is as provided.
        } 
        updateUnreads(selectedUser.id, loggedinuserdetails.id);
        setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[selectedUser.id];  // removed key
            return newCounts;
        });
    }, [selectedUser, loggedinuserdetails, unreadCounts]);
    useEffect(()=> {
        //this is for clearing the state of pendingCount and accordingly making db changes 
        if(!selectedUser || pendingCounts[selectedUser.id] === undefined || !loggedinuserdetails){
            return;
        }
        //if code reaches here means, pendingCounts[selectedUser.id] is not undefined, there is some pending messages from the id 'selectedUser.id
        const updatePending = async (senderId, loggedinuserid) => {
            const response = 
            await api.post('/api/auth/msg/updatepending', { senderId, loggedinuserid }, // ✅ 2nd arg: PAYLOAD
            { headers: { Authorization: `Bearer ${token}` } }  // ✅ 3rd arg: CONFIG
            );
            console.log('pending updated in db: ',response.data);
        }
        updatePending(selectedUser.id, loggedinuserdetails.id)
        //finally updating the state of pending messages.
        setPendingCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[selectedUser.id];  // removed key
            return newCounts;
        });
    }, [selectedUser, pendingCounts, loggedinuserdetails])

    const handleSelectedUser = (selectedOtherUserId) => {
        // console.log('handle selected user fn just ran.')
        //this will accept an argument which will be the id of other user.... since on my left, all my friends are other users. so, just get values corresponding to the key(that other user id) from chatsByUser state (which is an object)
        // console.log(selectedOtherUserId);

        //first set the state of selectedUser.. which contains the id and username of selected user. This id and username is fetched from friendList
        if(Object.keys(friendsList).length === 0) {
            return;
        }
        console.log('selected freind is: ',friendsList[selectedOtherUserId]);
        setSelectedUser(friendsList[selectedOtherUserId]);

        //implement useeffect with selecteduser as dependency.check if unreadCount contains selecteduser.id.. if yes, emit event where you send selecteduserid, loggedinuserid and make sql to update status of unread messages. sources of unread messaes-- where deliveredatnot null(they have their status as delivered) as well as deliveredat null(they have their status as sent). But unread should be ones whose deluveredat (not null, thus status as delivered), whereas pending will be ones whose (broadcastedat is null so will be deliveredat is NULL)
        // console.log(chatsByUser);
        //now to get all the chats of selected user, we look the reeived otheruserid in the chatsByUser state. 
        //check if chatsByUSer contains any value
        if (Object.keys(chatsByUser).length === 0) {
            return;
        } 
        const chatsBySelectedUser = chatsByUser[selectedOtherUserId];
        console.log(chatsBySelectedUser);
        console.log('loggedin user: ', loggedinuserdetails)
        // setSelectedUser(user);
        // console.log(user);
        // const value = chatsByUser[user.id];
        // console.log(value)
        // console.log(typeof(selectedOtherUserId));
        // console.log(selectedUser.id)
        
    }
    const handleChangeMessage = (e) => {
        const value = e.target.value;
        setNewMessage(value);
    }
    const handleSendButton = (e) => {
        e.preventDefault();
        //establish privatemessage lieterners ad handlers only if selectedUser is not false, newMessage is valid, loggedinuserdetails is valid and selectedUser is not null
        if (!selectedUser || newMessage.trim().length===0 || !loggedinuserdetails || !selectedUser || !socket) return;
            socket.emit('private-message',{from: loggedinuserdetails.id, to: selectedUser.id, message: newMessage}, (clientAck) => {
            // console.log(clientAck); //clientAck({status: 'ok', message: `message successfully saved to db: ${result.insertId}`});
        });
        setNewMessage('');
    }
    
    return (
          
        <>
        <div className="chat-wrapper">
                <div className="chat-container">
                    {/* left: sidebar */}
                    <div className="chat-sidebar">
                        {/* current user info */}
                        <div className="sidebar-header">
                            <div className=" avatar small-avatar">
                                <span className="avatar-initials">
                                    { loggedinuserdetails?.username ? loggedinuserdetails.username.trim().charAt(0).toUpperCase() : 'U'}
                                </span>
                            </div>
                            <div className="sidebar-userinfo">
                                <div className="sidebar-username">{loggedinuserdetails?.username}</div>
                                <div className="sidebar-status">Online</div>
                            </div>
                            <button className={`sidebar-logout-btn ${loggingout ? "logging-out" : ""}`} onClick={handleLogout} type="button" disabled={loggingout}>{loggingout ? '...' : ''}</button>
                        </div>

                        {/* displaying my friends in left sidebar  */}
                        <div className="sidebar-users">
                            <h2 className="sidebar-title">Chats</h2>
                            <div className="searchFriend-div">
                                <input type="text" className="searchFriend" value={searchFriend} onChange={(e) => setSearchfriend(e.target.value)}/>
                            </div>

                                {Object.entries(friendsList).map(([otheruserid, otheruserdetails]) => {
                                    const unreadCount = unreadCounts?.[otheruserid] || 0;
                                    const pendingCount = pendingCounts?.[otheruserid] || 0;
                                    const total = unreadCount + pendingCount;
                                    // console.log(typeof unreadCount);
                                    // console.log( typeof pendingCount)
                                    // console.log(total);
                                    return (
                                        <div 
                                        key={otheruserid} 
                                        onClick={() => handleSelectedUser(otheruserid)} 
                                        className={selectedUser?.id == otheruserid ? 'user-item user-item-active' : 'user-item'}
                                        >
                                            <div className="user-avatar">
                                                {otheruserdetails.username.trim().charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="user-info">
                                                    <div className="user-name">{otheruserdetails.username}</div>
                                                    {total > 0 && (
                                                <span className="unread-dot">{total > 99 ? '99+' : total}</span>
                                                )}
                                                </div>
                                            </div>
                                            
                                        </div>
                                    );
                                    })}
                            
                        </div>
                    </div>

                    {/* right sidebar  */}
                    <div className="chat-main">
                    {selectedUser ? (
                        <>
                            <div className="chat-header">
                                <div className="avatar-username-container">
                                    <div className="user-avatar">{selectedUser.username.trim().charAt(0).toUpperCase()}</div>
                                    <span className="user-name">{selectedUser.username}</span>
                                </div>
                            </div>
                        {/* showing messages history */}
                            <div className="chat-messages">
                                    {chatsByUser[selectedUser.id]?.map((msg) =>{
                                        const isOutgoing =
                                        loggedinuserdetails?.id &&
                                        msg.sender_id === loggedinuserdetails.id;
                                        return (
                                        <div
                                            key={msg.id}
                                            className={
                                            isOutgoing
                                                ? 'message-row message-outgoing'
                                                : 'message-row message-incoming'
                                            }
                                        >
                                            <div className="message-bubble">
                                            <div className="message-text">{msg.message}</div>
                                            </div>
                                        </div>
                                        );

                                    })}


                                
                            </div>
                        </>
                    ): (<> <div className="chat-placeholder">
                            <h1 className="welcome-text">Welcome, {loggedinuserdetails?.username}.</h1>
                            <p>Select a user from left to start chatting.</p>
                        </div> </>)}

                    {/* input field: has to be the part of chat-main */}
                        <form className="chat-input-row" onSubmit={handleSendButton}>
                            <input
                            type="text"
                            className="chat-input"
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={handleChangeMessage}
                            />
                            <button
                                type="submit"
                                className="chat-send-btn"
                                disabled={!selectedUser || !socket}
                            >
                                Send
                            </button>
                        </form>

                    </div>



                </div>
            </div>
        </>
    )
}