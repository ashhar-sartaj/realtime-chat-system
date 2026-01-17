import axios from "axios";
import { useState, useEffect } from "react";
import { io } from 'socket.io-client'
export function SecChat({onLogout}) {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [users, setusers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null); //to handle when the cuurent user clicks on the users from the sidebar
    const [messages, setMessages] = useState([]); //message history
    // const [message, setMessage] = useState(''); 
    const [newMessage, setNewMessage] = useState('');//state of current message
    const [username, setUsername]  = useState('');
    const [dashboardOwnerId, setDashboardOwnerId] = useState(null);
    const [loggingout, setLoggingout] = useState(false);
    const [socket, setSocket] = useState(null);//trcaking the socket state. 
    const [token, setToken] = useState(localStorage.getItem('token'));
    //first thing on loading is fetching the token from localstorage and sending it for authenticateToken middleware authentication via requesting protected route '/api/auth/msg/user'. Also, note that all the errors sent from middleware while authneticating token will have to be interecepted here 
    useEffect(()=>{
        const fetchOtherUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                if(!token) {
                    handleAuthFailure('Unauthorized: token missing/not fetched from ls')
                }
                const response = await axios.get('/api/auth/msg/user', {headers: {Authorization:`Bearer ${token}`}});
                setusers(response.data.dbUsers);
                setUsername(response.data.dashboardOwner);
                setDashboardOwnerId(response.data.dashboardOwnerId);
                // if(response.data.dbusers.length === 0) {
                //     setSideUsersMsg('No friends to display')
                // }
            } catch(error) {
                //catching error from tokenAuthentication middleare
                handleAuthFailure(error.response?.data?.message || 'Token auth failed.')
            } finally{
                setLoading(false);
            }
        }
        const initiateClientConnection = () => {
            const lsToken = localStorage.getItem('token');
            if(!lsToken) {
                handleAuthFailure('Unauthorized: token missing/not fetched from ls')
            }
            const newSocket = io('/', {auth:{token: lsToken}});
            newSocket.on('connect', () => {
                console.log('Connected: msg from clinet');
            })
            
            //to handle socketAuth middlware error or for auth/connection falures 
            newSocket.on('connect_error', (err)=>{
                console.log("connect_error event: ",err.message);
                handleAuthFailure(err.message);
            });
            newSocket.on('error', (error) => {
                console.log('error event from client: ', error.message);
            }) 
            newSocket.on('disconnect', (reason)=>{
                console.log('Disconnected. Reason: ', reason);
            });
            //listening for incoming/broadcasted message. Now, we want this broadcasted message to save it to db and messages state. 
            newSocket.on('receive-broadcasted-message', (data) => { //listeing the broadcasted message.
                console.log(`message received from sender: ${data.from}, as ${data.message} at ${data.timestamp} to ${data.to}`);
            })
            setSocket(newSocket);
        }
        fetchOtherUsers();
        if(!socket) {
            initiateClientConnection();
        }
        ()=>{
            socket?.disconnect();
            setSocket(null);
        }
    }, []);
    
    //common function to handle authentication failure: will set the token as null. Socket disocnnection will be there in the clean up
    const handleAuthFailure = (err) => {
        console.log(err);
        setError(err);
        localStorage.removeItem('token');
        setToken(null);
        socket?.disconnect();
        //in the clean up set the token as null.. and not here.
        setTimeout(()=>{
            onLogout?.();
        }, 1000);
    }
    
    const handleLogout = (e) =>{
        e.preventDefault();
        setLoggingout(true); //show loading
        localStorage.removeItem('token');
        setTimeout(()=>onLogout?.(), 1000); //brief delay for user feel
    }
    const handleSelectUser = async (selecteduser) =>{
        try {
            const token = localStorage.getItem('token');
            setSelectedUser(selecteduser);
            // here we are setting the extracted data from our DB query to selectedUser state. the state of selectedUser wil be an object containing all the details of the selectedUser ({id, username})
            console.log('selecteduser is ',selecteduser);
            // console.log('selectedUser is ',selectedUser);//this is throwing null because the state updation in react takes time... so accessing the state instantly gives null.
            //making request and sending the token in the headers. This request will fetch the messages of the selected user.  the id(params) we are sending is supposed to be senderid
            const response = await axios.get(`/api/auth/msg/history/${selecteduser.id}`,{headers: {Authorization: `Bearer ${token}`}}); //here we will query the db (messages table) and fetch messages. end point: '/api/auth/msg/history/:id'
            console.log('below is the response.data')
            console.log(response.data);
            // console.log('below is the response');
            // console.log(response);
            //setting the fetched messages in the messages state.//response.data is an array(containing objects of messages) returned from db query 
            setMessages(response.data); 
            //in this function only -- we will set the messages state as messages are fetch through the request.
        } catch(error) {
            console.log(error);
        } 
    }
    const handleChangeMessage = (e) => {
        setNewMessage(e.target.value);
    }
    const sendMessage = () => {
        //checking socket connection
        if(!socket?.connected) {
            console.log('socket is not connected.');
            return;
        }
        //checking if the newMessage is just a empty message
        if(newMessage.trim.length()===0) {
            setError('Cannot send empty message.')
            return;
        }
        //chekcing of selectedUser is false (null)
        if(!selectedUser) {
            console.log('Please select user to send message.');
            return;
        } 
        //Now finally emitting the message
        socket.emit('private-message', {
            receiverUserid: selectedUser.id, 
            message: newMessage, 
        })
    }
    const handleSendMessage = (e) => {
        e.preventDefault();
        //here emit the socket event as till now the state of selectedUser has been setted. 
        sendMessage();

        //inserting the new message to messages
        //prev => [...prev, { id: 12, name: "krish" }]
        // setMessages(prev => [...prev, {
        //     id: 16,
        //     message: newMessage,
        //     receiver_id: selectedUser.id,
        //     sender_id: dashboardOwnerId,
        //     timestamp: "2025-09-22T21:07:55.000Z"
        // }]);
        setNewMessage('');
    }
    
    
    if (loading) {
        return (
            <div className="chat-wrapper">
                <div className="chat-box">
                    <div className="spinner"></div>
                    <p className="loading-text">Loading..</p>
                </div>
            </div>
        )
    }
    return (
    <div className="chat-wrapper">
        <div className="chat-container">
            {/* left: sidebar (user info) */}
            <div className="chat-sidebar">
                {/* current uder info */}
                <div className="sidebar-header">
                    <div className=" avatar small-avatar">
                        <span className="avatar-initials">
                            {username ? username.trim().charAt(0).toUpperCase() : 'U'}
                        </span>
                    </div>
                    <div className="sidebar-userinfo">
                        <div className="sidebar-username">{username}</div>
                        <div className="sidebar-status">Online</div> 
                        {/* online can be conditionally rendered later on */}
                    </div>
                    <button className="sidebar-logout" onClick={handleLogout} disabled={loggingout} type="button">{loggingout ? '...' : 'logout'}</button>
                </div>
                {/* displaying users list (fetched from db) */}
                <div className="sidebar-users">
                    <h2 className="sidebar-title">Chats</h2>
                    {users.length === 0 ? (
                        <p className="sidebar-empty">No users to chat with yet..</p>
                    ) : (
                        users.map((el) => (
                            <div key={el.id}  onClick={()=>handleSelectUser(el)} className={selectedUser && selectedUser.id === el.id ? "user-item user-item-active": "user-item" }> {/* to distinguish between the selected user and other displayed user */}
                                <div className="user-avatar">{el.username.trim().charAt(0).toUpperCase()}</div>
                                <div className="user-info">
                                    <div className="user-name">{el.username}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            {/* Right chat area */}
            <div className="chat-main">
                {selectedUser ? (
                    <><div className="chat-header"> 
                        <div className="avatar-username-container">
                            <div className="user-avatar">{selectedUser.username.trim().charAt(0).toUpperCase()}</div>
                            <span className="user-name">{selectedUser.username}</span>
                        </div>
                    </div>
                    {/* showing messages history */}
                        <div className="chat-messages">{messages.length === 0 ? (<p className="chat-empty">No messages yet! Say hii!</p>) : 
                        (messages.map((msg) => (<div key={msg.id} className={msg.sender_id === dashboardOwnerId ? "message-row message-outgoing":"message-row message-incoming"}>
                            <div className="message-bubble">
                                <div className="message-text">{msg.message}</div>
                            </div>
                        </div>)))}
                    </div>

                    {/* input box */}
                    <form className="chat-input-row" onSubmit={handleSendMessage}>
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
                            disabled={!newMessage.trim()}
                        >
                            Send
                        </button>
                    </form>
                    </>
                    ) : (
                        <div className="chat-placeholder">
                            <h1 className="welcome-text">`Welcome, {username}.`</h1>
                            <p>Select user from left to start chatting</p>
                        </div>
                    )}
            </div>
        </div>
    </div>
)
}