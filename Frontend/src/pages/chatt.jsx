import { api } from "../api/axios.js";
import { useEffect } from "react";
import { useState, useRef} from "react"
import { io } from 'socket.io-client'
export default function Chatt({onLogout}) {
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState({ loggedInUserDetails: true, loggedInFriendsDetails: true, chats: true });
    const [loggedinuserdetails, setLoggedinuserdetails] = useState(null);
    const [error, setError] = useState(null);
    const [loggingout, setLoggingout] = useState(false);
    const [chatsByUser, setChatsByUser] = useState({});
    const [friendsList, setFriendsList] = useState({}); //initialising it with {} will help us to create a lookup object.. so we just check is the record exist via objname.friendId
    const [unreadCounts, setUnreadCounts] = useState({}); //initialise with {} to get rid of initial check i.e null[selectedUser.id]
    const [pendingCounts, setPendingCounts] = useState({}); //initialise with {} to get rid of initial check i.e null[selectedUser.id]
    const [selectedUser, setSelectedUser] = useState(null); //track current seletced user. is an object with props id and username.
    const [newMessage, setNewMessage] = useState('');
    const [refreshChats, setRefreshChats] = useState(false);
    const [searchFriend, setSearchfriend] = useState('');
    const [searchResult, setSearchresult] = useState([]);
    const [showResult, setShowResult] = useState(false);
    const [socket, setSocket] = useState(null);
    const resultsRef = useRef(null); //{ current: null }: for handling click outside the search result div.
    //initial state of our resutlRef is null...but when there are search results displayed, it is not null
    const [onlineUsers, setOnlineUsers] = useState([]);
    // const avatarBgColor = React.useMemo(() => generateColorCode(), []);
    const isBtnDisabled = newMessage.trim().length === 0;
    useEffect(() => {
        //this usefeect will only handle connection.. and other useeffect will handle all the event listeners.
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
        if (!socket) return;
        socket.on('userOnline', (userId) => {
            // console.log(data);
            // setting the state of onlineUsers
            setOnlineUsers(prev => ({ ...prev, [userId]: true })); //means the user with userId is online

        })
        socket.on('userOffline', (userId) => {
            setOnlineUsers(prev => {
                const newOnline = { ...prev }; //making the copy of our onlineUsers (previous state).. which is staged to be modified
                delete newOnline[userId];
                return newOnline;
            });
        })
        return () => {
            socket.off("getOnlineUsers");
            socket.off("userOffline");
        }

    }, [socket])
    useEffect(() => {
        //implementing  i need to have a separate useeffect containing scenario where receiver if offline.  this useffect should not be run if selectedUser is null, loggedinuserdetails is null, socket is null
        
        if (!socket || !loggedinuserdetails, !selectedUser) return; // if selectedUser is null, 
        const receiveMessageHandlerReceiverOffline = (message) => {
            setChatsByUser((prev) => {

                const chatHistory = { ...prev };
                const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                if (!chatHistory[otherUser]) {
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

    useEffect(() => {
        //implementing useeffect if receiver is online--- scenario: if selectedUser is null, if selectedUser not null-- here two scenario is selectedUser.id === from, selectedUser.id !== from
        if (!socket || !loggedinuserdetails) return;
        const receiveMessageHandlerReceiverOnline = (data) => {
            const { from, to, message } = data;
            if (selectedUser?.id === from) {
                setChatsByUser((prev) => {
                    const chatHistory = { ...prev };
                    const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                    if (!chatHistory[otherUser]) {
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
                    socket.emit('messageReadReceiverOnline', { messageId: message.id }) //to update broadcasted_at, deivered_at, seen_at status as seen, senderid is from, receiverid is loggeedinuserid, id is equal to message.id
                }, 100)
            } else if (selectedUser?.id !== from) {
                setChatsByUser((prev) => {
                    const chatHistory = { ...prev };
                    const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                    if (!chatHistory[otherUser]) {
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
                setTimeout(() => {
                    console.log('about to emit messageUnreadReceiverOnline')
                    socket.emit('messageUnreadReceiverOnline', { messageId: message.id });//to update broadcasted_at, delivered_at, status as delivered
                }, 100)
            } else {
                //receiver online but no selectedUser → delivered 
                setChatsByUser((prev) => {
                    const chatHistory = { ...prev };
                    const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                    if (!chatHistory[otherUser]) {
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
                setTimeout(() => {
                    console.log('about to emit messageUnreadReceiverOnline')
                    socket.emit('messageUnreadReceiverOnline', { messageId: message.id });//to update broadcasted_at, delivered_at, status as delivered
                }, 100)
            }
        }
        socket.on('receiveMessageReceiverOnline', receiveMessageHandlerReceiverOnline);
        return () => {
            socket.off('receiveMessageReceiverOnline', receiveMessageHandlerReceiverOnline);
        }

    }, [socket, loggedinuserdetails, selectedUser])

    useEffect(() => {
        //this is the place where we have to handle the loggedin user who have 0 friends.
        //fetchLoggedinuserDetails() should run
        if (!token) return;
        let isCancelled = false;
        const fetchLoggedinuserDetails = async () => {
            // console.log('before fetching loggedin user',loggedinuserdetails)
            try {
                const info = await api.get('/api/auth/msg/loggedinuser', { headers: { Authorization: `Bearer ${token}` } }) //{id: , username: }
                // console.log("loggedinuserdetails: ",typeof(info.data))
                setLoggedinuserdetails(info.data);

            } catch (err) {
                console.log(err)
            } finally {
                if (!isCancelled) {
                    //if isCancelled is false then only set the state.
                    setLoading(prev => ({ ...prev, loggedInUserDetails: false }))
                }

            }
        }
        //this fetchFriendsDetails() should also run.. if in the response.. we get response.data.length == 0.. means 
        const fetchFriendsDetails = async () => {
            try {
                const response = await api.get('/api/auth/msg/myfriends', { headers: { Authorization: `Bearer ${token}` } });
                //in the response.data there can be 2 cases: response.data is not empty in case we have friends:[{id: ,  username}, {id, username}, {id, username}] or can be empty in case we didnt have any firend: []
                // console.log(response.data); //[{id: ,  username}, {id, username}, {id, username}]
                // console.log(typeof response.data)
                // const friendsDetail = response.data.data; 
                // setFriendsList(friendsDetail.reduce((acc, user) => {
                //     acc[user.id] = user;
                //     return acc;
                // }, {})); 
                
                if (response.data.length !== 0) {
                    const friendsDetail = response.data; //[{id: ,  username}, {id, username}, {id, username}]
                    // const answer = friendsDetail.reduce((acc, user) => {
                    //     acc[user.id] = user;
                    //     return acc;
                    // }, {})
                    // console.log(answer)
                    const friendsMap = friendsDetail.reduce((acc, user) => {
                        acc[user.id] = user;
                        return acc;
                    }, {});
                    setFriendsList(friendsMap)
                    

                    // setFriendsList(friendsDetail.map(user => ({
                    //     [user.id]: user
                    // })));
                }
                if (response.data.length===0) return; //dont update the friendList state.. it will remain {}
                
            } catch (err) {
                console.log(err)
            } finally {
                if (!isCancelled) {
                    setLoading(prev => ({ ...prev, loggedInFriendsDetails: false }))
                }
            }
        }
        fetchLoggedinuserDetails();
        fetchFriendsDetails();

        return () => {
            isCancelled = true; //since we are using 2 async calls... and if token changes quickely, then our aysnc operations could occur for different token value... so use isCancelled flag to make async call for single token
        }
    }, [token])

    useEffect(() => {
        //will fetch unread and set the state.
        if (!token || friendsList.length === 0) return;
        const fetchUnread = async () => {
            const response = await api.get('/api/auth/msg/unreads', { headers: { Authorization: `Bearer ${token}` } })
            const unreadCountBySender_id = response.data;  //[{…}, {…}, {…}, {…}]
            //[{"sender_id":1,"unread_count":3},{"sender_id":2,"unread_count":33},{"sender_id":3,"unread_count":1},{"sender_id":4,"unread_count":2}]

            // const ans = unreadCountBySender_id.reduce((acc, record)=> {
            //     acc[record.sender_id] = record.unread_count;
            //     return acc;
            // }, {})
            // console.log(ans); //{1: 3, 2: 33, 3: 1, 4: 2} the keys represents the sender_id(otheruser) and values are unread count. 
            setUnreadCounts(unreadCountBySender_id.reduce((acc, record) => {
                acc[record.sender_id] = record.unread_count;
                return acc;
            }, {}));
        }
        fetchUnread()
    }, [token]);
    useEffect(() => {
        if (!token) return;
        const fetchPending = async () => {
            //will fetching pending messages. disticntion betweem unread and pending. pending have broadcasted_at is null whereas unreads have broadcasted_at is not null. 
            const response = await api.get('/api/auth/msg/pending', { headers: { Authorization: `Bearer ${token}` } })
            const pendingCountBySenderId = response.data; //[{"sender_id":2,"pending_count":26}]
            // console.log(pendingCountBySenderId);
            // const ans = pendingCountBySenderId.reduce((acc, record)=> {
            //     acc[record.sender_id] = record.pending_count;
            //     return acc;
            // }, {});
            // console.log(ans);

            setPendingCounts(pendingCountBySenderId.reduce((acc, record) => {
                acc[record.sender_id] = record.pending_count;
                return acc;
            }, {})); //will convert it to {2: 26} and state of pendingCounts will be set to this.
        }
        //i want to run this function only if the friendList state ({}) is not empty
        if (Object.keys(friendsList).length !== 0) {
            fetchPending();
        }

    }, [token])
    //the result of commenting the below code is that all the friends of loggedin user are not showing up in left pane. So, basically in order to implement socket communication.... we need one request to fetch all the friends and their details of loggedin user. 
    useEffect(() => {
        if (!token || !loggedinuserdetails) return;
        const fetchChatsByUser = async () => {
            //issue this useeffect is running instead of the one that is listening to 'receiveMessage' event.. so just comment it out to check.
            try {
                const response = await api.get('/api/auth/msg/chats', { headers: { Authorization: `Bearer ${token}` } });
                
                const messages = response.data; //these message are not grouped by other user.

                // const messages = response.data; //looks like [{}, {}, {}]

                setChatsByUser(() => {

                    const myAllChats = {};// we will replace the current state with this.

                    //this myAllChats contains keys (as otheruserid) with value as an array consisting of objectes representingeach chat with loggedin user.

                    for (const message of messages) {
                        const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id; //thsi otheruser will be the key of myAllChats
                        if (!myAllChats[otherUser]) {
                            //insert this key
                            myAllChats[otherUser] = []
                        }
                        myAllChats[otherUser].push(message);
                    }

                    return myAllChats;
                })
                // setChatsByUser(() => {
                //     const chatsGroupedByOtherUser = {};
                //     for (const message of messages) {
                //         // if (loggedinuserdetails && Object.entries(loggedinuserdetails).length === 0) return;
                //         const otherUser = message.sender_id === loggedinuserdetails.id ? message.receiver_id : message.sender_id;
                //         //check if other user already exist
                //         if (!chatsGroupedByOtherUser[otherUser]) {
                //             chatsGroupedByOtherUser[otherUser] = [];
                //         }
                //         chatsGroupedByOtherUser[otherUser].push(message);
                //     }
                //     return chatsGroupedByOtherUser;
                // })
            } catch (err) {
                console.log(err)
            } finally {
                setLoading(prev => ({ ...prev, chats: false }))
            }
        }

        //want to fetch chats only if our friendList as some friends (have keys)
        if (Object.keys(friendsList).length !== 0) {
            fetchChatsByUser();
        }
        

        //what does chatsByUser looks like: it is an object containg keys as otheruserid (friendsofloggedinuser) and values as array of objects, where each object represents single message by that otheruser to current loggedinuser.
    }, [loggedinuserdetails, friendsList]); //there should be lggedinuseretails as dependency as the content of this useeffect depends on loggedinuserdetails. So, my chatsbyuser will not set even if loggedinuser changes. It took hrs to fiure this out. 
    //prev deps of above useeffect

    //that error of excess setting of otheruser is fixed by adding loggedinuserdetails as dependency here.
    //make change to state of refreshChats when: 1. selectedUser changes 2. loggedin user sends a message
    const handleAuthFailure = async () => {
        setLoggingout(true);
        try {
            // await api.post('/logout'); 
        } catch (err) {
            console.error("Server logout failed", err);
        }
        // 1. GLOBAL CLEANUP (The important part!)
        // Replace 'keydown' and 'handleGlobalKeydown' with your actual listener details
        // document.removeEventListener('mousedown', handleOutsideMouseClicks); //sice we arev remove this listener as a clean up in the effect in which it was defined, no need to do this.

        // 2. STORAGE & STATE
        localStorage.removeItem('token');
        setToken(null);
        setLoggedinuserdetails(null);
        setSelectedUser(null);

        // Direct call is safer/cleaner than the if-length check
        if (Object.keys(chatsByUser).length === 0) {//or simply setChatsByUser({}) as react can handle itself
            setChatsByUser({});
        }

        // 3. NETWORK
        socket?.disconnect();
        setSocket(null);

        // 4. NAVIGATION
        setTimeout(() => {
            onLogout?.();
        }, 1000);
    }
    const handleLogout = () => {
        handleAuthFailure();
    }
    useEffect(() => {
        if (Object.keys(chatsByUser).length === 0) return;
        console.log("chatsByUser: ", chatsByUser)
    }, [chatsByUser]);
    useEffect(() => {
        if (Object.keys(unreadCounts).length === 0) return;
        console.log("unread counts: ", unreadCounts)
    }, [unreadCounts])
    useEffect(() => {
        if (!selectedUser) return;
        console.log("sselected user: ", selectedUser);
    }, [selectedUser])
    useEffect(() => {
        // if (friendsList.length === 0) return;
        if (Object.keys(friendsList).length === 0) return;
        console.log(friendsList)
    }, [friendsList])
    //log of friendList state:  {1: {id: 1, username: 'ashhar'}} key is friends id 
    useEffect(() => {
        //check if unreadCount has selecteduser.id, if no, do nothing: return 
        if (!selectedUser?.id || unreadCounts[selectedUser.id] === undefined || !loggedinuserdetails?.id) {
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
            console.log('unread updated in db: ', response.data); //should be 1 if successful update

            //parameters of sql query to update pending : are records whose delivery IS NULL and status is sent.  to update: delivered at status as delivered WHERE  receiver_id is loggedinuser and sender_id is as provided.
        }
        updateUnreads(selectedUser.id, loggedinuserdetails.id);
        setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[selectedUser.id];  // removed key
            return newCounts;
        });
    }, [selectedUser, loggedinuserdetails, unreadCounts]);
    useEffect(() => {
        //this is for clearing the state of pendingCount and accordingly making db changes 
        if (!selectedUser || pendingCounts[selectedUser.id] === undefined || !loggedinuserdetails) {
            return;
        }
        //if code reaches here means, pendingCounts[selectedUser.id] is not undefined, there is some pending messages from the id 'selectedUser.id
        const updatePending = async (senderId, loggedinuserid) => {
            const response =
                await api.post('/api/auth/msg/updatepending', { senderId, loggedinuserid }, // ✅ 2nd arg: PAYLOAD
                    { headers: { Authorization: `Bearer ${token}` } }  // ✅ 3rd arg: CONFIG
                );
            console.log('pending updated in db: ', response.data);
        }
        updatePending(selectedUser.id, loggedinuserdetails.id)
        //finally updating the state of pending messages.
        setPendingCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[selectedUser.id];  // removed key
            return newCounts;
        });
    }, [selectedUser, pendingCounts, loggedinuserdetails])

    useEffect(() => {
        // user should be able to see all the friends from db expect itself. (basicallly to identify the loggedin user, use the id)
        //we will only run the api call when the search person must have atleast 2 letters, else no
        if (searchFriend.trim().length <= 2) {
            setSearchresult([]);
            return;
        }
        console.log('the searched friend is ', searchFriend);

        const delayTime = setTimeout(async() => { //this function is asynchronous and there is api hitting.
        
            try {
                const response = await api.get('/api/users/search', { params: { q: searchFriend }, headers: { Authorization: `Bearer ${token}` } })
                // console.log(searchedFriends)
                // setting the state of searchResult
                setSearchresult(response.data); //but if our the responsedat is empty array then?
                //set the showSearch result state.. if response.dat.length > 0.. means show result state will be true if response.data.length >0
                setShowResult(response.data.length > 0);
                console.log(response.data.length)
                //render the search results from the searchresult state.. only if showResut state is true.
            } catch(err) {
                console.log(err?.message);
            }
            
        }, 400)
        // console.log(searchFriend);

        return () => clearTimeout(delayTime)
    }, [searchFriend]);

    //useeffect that will add and remove click event listener on every render... Contans a functions that helps to handle click outside the search result div
    useEffect(() => {
        const handleOutsideMouseClicks = (event) => {
            //we will onykonly hidethe result if the result is displayed/exist at the first place. Sso, to confirm that we do: resultRef.current should not be null as the resultRef is attached to the div showing result. 
            //so, resultRef.current.contains should be 'mousedown' event if the user clicked inside the div dispaying the result. 
            // 1. Is ref attached to real DOM element?
            if (!resultsRef.current) return;  // No dropdown yet, ignore

            // 2. Did click happen INSIDE dropdown?
            if (resultsRef.current.contains(event.target)) return;  // Yes → ignore

            // 3. Click was OUTSIDE → hide dropdown
            setShowResult(false);
        }
        document.addEventListener('mousedown', handleOutsideMouseClicks); //handleClickOutside is the function that hides results

        return () => document.removeEventListener('mousedown', handleOutsideMouseClicks);
    }, [])

    const handleSelectedUser = (selectedOtherUserId) => {
        // console.log('handle selected user fn just ran.')
        //this will accept an argument which will be the id of other user.... since on my left, all my friends are other users. so, just get values corresponding to the key(that other user id) from chatsByUser state (which is an object)
        // console.log(selectedOtherUserId);

        //first set the state of selectedUser.. which contains the id and username of selected user. This id and username is fetched from friendList
        
        
        //--------------------------------------------------------------------------------------------
        //below to implement: when the new user search their friend, and chooses some.
        //Check if the selecteduser is in our friendList...if not, just add (for the ui).

        if (Object.keys(friendsList).length === 0) {
            return;
        }
        console.log('selected freind is: ', friendsList[selectedOtherUserId]); //{id: 5, username: 'krishna'}
        setSelectedUser(friendsList[selectedOtherUserId]);//our selectedUser wil be {id: 5, username: 'krishna'}


        //check if Object.keys(chatsByUser) has selectedOtherUserId.. if yes, then, const chatsBySelectedUser = chatsByUser[selectedOtherUserId], if no, then you have to create a key by selectedOtherUserId and sets its value as []
        setChatsByUser((prev) => {
            //if Object.keys(chatsByUser) has selectedOtherUserId.. means we already has a chats with that selected user..do nothing, jsut return the prev. Else add the key(otheruserid) with an empty array.
            // so const chatsBySelectedUser = chatsByUser[selectedOtherUserId] will have all the chats with that selected user
            
            if (prev[selectedOtherUserId]) return prev;
            // If not, add the key with an empty array
            return {
                ...prev,
                [selectedOtherUserId]: []
            };
        })

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
        // console.log('message was ', newMessage)// ok
        //establish privatemessage lieterners ad handlers only if selectedUser is not false, newMessage is valid, loggedinuserdetails is valid and selectedUser is not null
        if (!selectedUser || newMessage.trim().length === 0 || !loggedinuserdetails || !selectedUser || !socket) return;
        socket.emit('private-message', { from: loggedinuserdetails.id, to: selectedUser.id, message: newMessage }, (clientAck) => {
            // console.log(clientAck); //clientAck({status: 'ok', message: `message successfully saved to db: ${result.insertId}`});
        });
        setNewMessage('');
    }
    const handleSearchClick = (searchedFriend) => {
        console.log('searched friend is: ', searchedFriend) //{id: 2, username: 'rohan'}
        const friend = searchedFriend;
        //setting the state of frinedlsit to  trigger placement of the searched friend on the left side.
        setFriendsList((prev) => ({
            ...prev,
            [searchedFriend.id]: friend
        }))
        //set the state of selectedUser.. this will be done automatically when the friendList will trigger re-render of the left side.
        //set the state of chatsByUser
        setSearchfriend('')
    }   
    return (
        <main>
            {/* <h1 className="title">ChatApp</h1> */}

            <div className="container">
                {/* SECTION 1: USERS SIDEBAR */}
                <aside className="users-section">

                    {/* Part 1: Logged-in User Details */}
                    <div className="logged-in-user">
                        <div className="loggedin-in-user-childOne">
                            <div className="user-avatar">{loggedinuserdetails?.username.trim().charAt(0).toUpperCase()}</div>
                            <div className="user-info">
                                <span className="user-name">
                                    {loggedinuserdetails?.username.trim().toUpperCase()} {loggingout?'...':'(You)'}
                                    {/* {loggedinuserdetails?.username ? loggedinuserdetails.username.trim().toUpperCase() : 'U'}(you) */}
                                </span>
                                <span className="user-status">{loggingout ? '...':'Online'}</span>
                                
                            </div>
                        </div>
                        {/* for logout button  */}
                        <button type="button" value={loggingout} onClick={handleLogout} className={`logout-btn ${loggingout ? "disable-btn" : ""}`} disabled={loggingout}>{loggingout ? '...':'Exit'}</button>
                    </div>

                    {/* Part 2: Friends List Container */}
                    <div className="friends-list-container ">
                        <h3 className="sidebar-title" >Chats</h3>
                        <div className="search-div">
                            <input
                                type="text"
                                className="searchFriend"
                                placeholder="Search friends..."
                                value={searchFriend}
                                onChange={(e) => setSearchfriend(e.target.value)}
                            />
                            {showResult && (
                                <div ref={resultsRef}  className="search-dropdown">{
                                    searchResult.map((item) => (<div key={item.id} className="search-friend-result" onClick={() => handleSearchClick(item)}>{item.username}</div>))
                                }</div>
                            )}
                        </div>
                        <div className="friends-list ">
                            {Object.keys(friendsList).length !== 0 && Object.entries(friendsList).map(([otheruserid, otheruserdetails]) => {
                                const unreadCount = unreadCounts?.[otheruserid] || 0;
                                const pendingCount = pendingCounts?.[otheruserid] || 0;
                                const total = unreadCount + pendingCount;
                                return (<div
                                    key={otheruserid}
                                    onClick={() => handleSelectedUser(otheruserid)}
                                    className={selectedUser?.id == otheruserid ? 'user-item active' : 'user-item'}
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

                                </div>)
                            })}

                            
                        </div>
                    </div>
                </aside>

                {/* SECTION 2: CHATTING AREA */}
                {Object.keys(friendsList).length === 0 ? (
                    <section className="empty">
                        <h2>You dont have any friends!</h2>
                    </section>
                ): (
                        <section className = {`chatting-section ${!selectedUser ? 'empty' : 'active'}`}>
                {selectedUser && chatsByUser[selectedUser.id] ? (
                    <div className="chat-content">
                        <header className="chat-header">
                            <span className="user-avatar">
                                {selectedUser.username.trim().charAt(0).toUpperCase()}
                            </span>
                            <span>
                                <div>{selectedUser.username}</div>
                                <div className="selected-user-status">{onlineUsers[selectedUser?.id] ? 'Online' : 'Offline'}</div>
                            </span>
                            {/* note: since we are looking up i js object like onlineUsers[selectedUser.id]... if the key isnt present, js will not throw errror.. it says it is undefined-so moves to implement false case  */}
                            {/* <span>{selectedUser.username}</span> */}
                        </header>
                        <div className="chat-messages-pane">
                            {chatsByUser[selectedUser.id]?.map((msg) => {
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
                                        {/* <div className={isOutgoing ? 'message-bubble-outgoing' : 'message-bubble message-bubble-incoming' }> */}
                                        <div className={isOutgoing ? 'message-bubble-outgoing' : 'message-bubble-incoming'}>
                                            {/* if isoutgoing is true, message-bubble message-bubble-outgoing else message-bubble-incoming */}
                                            <div>{msg.message}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="chat-input-div">
                            <input className="chat-input" placeholder="type your message..." value={newMessage}
                                onChange={handleChangeMessage}
                            />
                            <button type="submit" className="chat-send-btn" disabled={isBtnDisabled || !socket} onClick={handleSendButton}>Send</button>
                        </div>




                    </div>
                ) : (
                    <div className="chat-placeholder">
                        <div className="placeholder-icon">💬</div>
                        <h2>Your Messages</h2>
                        <p>Select a friend from the left to start a conversation..</p>
                    </div>
                )}

            </section>
                )}

                

                
            </div>
        </main>
    )
}