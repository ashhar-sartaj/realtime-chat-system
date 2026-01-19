import { api } from '../api/axios.js';
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
function Register({onRegister}) {
    const [formData, setFormData] = useState({username:'', password:'', confirmPassword:''});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('')
    useEffect(()=>{
        //this cleanup will run as soon as the component unmounts.
        return ()=>{
            setSuccess('');
        }
    }, [])
    const handleChange = (e) => {
        const {name, value} = e.target;
    setFormData(prev => ({
        ...prev,
        [name] : value
    }))
    }
    const handleSubmit = async (e) => {
        //verifying the entered details authenticity at the backened as well. like 
        // length of username min as 6. 
        // password length min 8 consisting of Uppercase, lorecase, special character
        //the matching of confirm password with password. 
        //NOTE: do this backend verifcation process when making full fledged authtication project. For now, apply whatever validation is available at frontend. 

        e.preventDefault();
        setError?.('');
        if(formData.password !== formData.confirmPassword) {
            setError('password and conform password do not match.');
            return;
        }
        //submitting data to backened via axios
        try {
            const response = await api.post('/api/auth/register', {"username": formData.username, "password": formData.password});
            //we get the json object as a response like: json({createdUser: user.username})
            const {createdUser} = response.data;
            // alert(`${createdUser} successfully registered! Please login to start chat.`);
            setSuccess(`User ${createdUser} created successfully.`)
            setTimeout(()=>{
                onRegister?.();
            }, 1000)
        } catch(error) {
            // setError(error.response?.data?.message || 'something went wrong!') //handling error more gracefully (client side & server side)
            const errorCode = error.response?.status
            const errorMessage = error.response?.data?.message
            if(errorCode === 400) {
                setError(errorMessage || 'Client error: provide both username and password')
            } else if(errorCode === 409) {
                setError(errorMessage || 'Client error: username already registered, provide another.')
            } else {
                //catering to serverside error 500: error creating user (thrown from backeend)
                setError(errorMessage || 'Server error: user creation failed, try again.')
            }
        }

    }
    return (
        <div className="container">
            <div className="login-form">
                <h2>Talkies Inn</h2>
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
                        <input type="text" id="username" name="username" onChange={handleChange} value={formData.username} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" onChange={handleChange} value={formData.password} required minLength="6" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" onChange={handleChange} value={formData.confirmPassword} required />
                    </div>
                    <div className="register-or-login-container">
                        <div><button type="submit">Register</button></div>
                        <div>Already registered? <Link to='/login'>Login</Link></div>
                    </div>
                    
                </form>
            </div>
        </div>
    )
}
export default Register;