import { useEffect, useState } from "react"
import axios from 'axios'
function Chat({onLogout}) {
    const [loading, setLoading] = useState(true); //should start from true. 
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [username, setUsername] = useState('');
    const [loggingout, setLoggingout] = useState(false);
    useEffect(()=>{
        return ()=>{
            setError('');
            setMessage('');
            setUsername('');
        }
    }, [])

    useEffect(()=>{
        //since this is supposed to be protected (means require middleware token authticaton).. retrieve the token from localstorage.
        //Also, in the app.jsx, this will be displayed only when authenticated is true(measn token is issued in localstorage), so fetch the token
        // '/api/auth/chat' is protected route in backened. and with axios request we are sending the token for middleware token authentication and accordingly our response will be coming from the backened. 
        const sendTokenForMidAuth = async () => {
            try {   
                const token = localStorage.getItem('token');
                if(!token) {
                    handleAuthFailure('Unauthorized: missing token')
                    return;
                }
                const response = await axios.get('/api/auth/msg/user', {headers: {Authorization:`Bearer ${token}`}}); //sending this token with our request.
                console.log(response.data);//res.json({dbUsers: rows(obj), message: greeting, dashboardOwner: `${req.user}`})
                setMessage(response.data.message);
                setUsername(response.data.dashboardOwner);
            } catch(error) {
                // console.log(error.response.data.message);
                //backend send 2 error codes: 403 if error if token verification with jsonresponse ({ message: err.message });
                //other eror code is 401 if tokenis not presnet.  json({message: "You are trying to access protected route
                const status = error.response?.status;
                const msg = error.response?.data?.message; //here, msg allso captures 'throw err'
                if(status === 401) {
                    handleAuthFailure(msg || 'Token authentication failed.')
                } else { //to capture other error status
                    //to capture throw err from backend 
                    handleAuthFailure(msg || 'Token authentication failed.')
                }       
                // setLoading(false); //this is not required now, as the code in if else will set it to false. 
            } finally { //always runs 
                setLoading(false);
            }
            // const handleAuthFailure = (msg) => {
            //     setError(msg);
            //     localStorage.removeItem('token')
            //     //auto logout
            //     setTimeout(()=>onLogout?.(),1000)
            // }   
        }
        setTimeout(()=>{
            sendTokenForMidAuth(); //delayong calling the function-- to see loading (for user feel)
        }, 3000);
        
    }, [onLogout]) //this ensures that onLogout has the references to latest value i.e value to authentication as true or false. We need to run this effect everytime there is a chenge to the state of onLogout
    const handleLogout = (e) =>{
        e.preventDefault();
        setLoggingout(true); //show loading
        localStorage.removeItem('token');
        setTimeout(()=>onLogout?.(), 1000); //brief delay for user feel
    }
    if (loading) {
        return <div className="protected-wrapper">
            <div className="protected-box">
                <div className="spinner"></div>
                    <p className="loading-text">Loading...</p>
            </div>
        </div>
    }    
    return (
    <div className="protected-wrapper">

        <div className="protected-box">

            {/* Welcome Message */}
            <h1 className="welcome-text">
            {message}
            </h1>

            {/* Avatar */}
            <div className="avatar-container">
            <div className="avatar">
                <span className="avatar-initials">
                {username ? username.trim().charAt(0).toUpperCase() : 'U'}
                </span>
            </div>
            </div>

            {/* Logout Button */}
            <button
            className="logout-button"
            onClick={handleLogout}
            disabled={loggingout}
            type="button"
            >
            {loggingout ? "Logging out..." : "Logout"}
            </button>

        </div>

  {/* Error */}
  {error && <div className="error">{error}</div>}

</div>
);
}
export default Chat;