import axios from "axios";
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom";


function Login({onLogin, onRegister}) {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        username:'',
        password:''
    })
    useEffect(()=>{
        return () => {
            setSuccess?.('')
        }
    },[])
    const handleChange = (e) => {
        const {name, value} = e.target;
        setFormData(prev => ({
            ...prev, 
            [name]: value
        }))
    }
    const handleSubmit = async(e) => {
        e.preventDefault();
        setError?.('');
        try {
            const response = await axios.put('/api/auth/login', {username: formData.username, password: formData.password});
            console.log(response);
            //response will be json response: json({token: tokenGen, username: user.username});
            //destructuring response.data object to store generated token in the browser localstorage
            const {token,username} = response.data;
            localStorage.setItem('token', token); //token is issued here. 
            setSuccess(`${username} logged in successfully.`)
            setTimeout(()=>{
                onLogin?.()
            }, 1000);
        } catch(error) { //handling error gracefully (client and server)
            // setError(error.response.data.message||'something went wrong')
            const errorCode = error.response?.status; 
            const errorMessage = error.response?.data?.message
            if(errorCode === 400) {
                //handling: provide both user name and password
                setError(errorMessage || 'Client error: invalid credentials.')
            }  else if(errorCode === 401) {
                //includes provide valid credentials + User doesnt exist.
                setError(errorMessage || 'Client error: invalid credentials/user doesnt exist')
            } else { //handling 500
                setError(errorMessage || 'Server error: user login failed, try again.')
            }
        }
    }
    const handleRegister = (e) => {
        e.preventDefault();
        onRegister?.();
        navigate('/register')
    }
    
    return (
        <div className="container">
            <div className="login-form">
                <h2>Login</h2>
                {
                    error ? (
                        <div className="error">{error}</div>
                    ) : (
                        success && <div className="success">{success}</div>
                    )
                }
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            required
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>
                        
                    <div className="logRegDivBtn">
                            <div><button type="submit" className="btn-login">Login</button></div>
                            {/* this register have to be shown conditionally */}
                            {error === 'User doesnt exist.' && (<><button type="button" className="btn-register" onClick={handleRegister}>Register</button></>)}
                    </div>
                </form>
            </div>
        </div>
    )
}
export default Login