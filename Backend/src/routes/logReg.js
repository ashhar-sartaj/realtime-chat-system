//contains all the same logic as logre.js, but w/ database cal instead of in-memory database
import express from 'express'
import { userActions } from '../data/handleUserswDb.js';
import { generateJWT } from '../middleware/midlewre.js';
const router = express.Router();
//will include end points of base url (as per app.jsx): '/api/auth'
router.get('/', (req, res) => {
    res.status(200).send("GET request to '/api/auth'");
}) 
//register
router.post('/register',  async(req, res) => {
    //fetching username and password
    try {
        const {username, password} = req.body;
        if(!username || !password) {
            return res.status(400).json({message: 'bad request: username and password are required.'})
        }
        const user = await userActions.createUser(username, password); //return an object of username {username}
        return res.status(201).json({createdUser: user.username});
    } catch(error) {
        if(error.message === 'Username already exist. Provide different username.') {
            return res.status(409).json({message: error.message})
        } else {
            return res.status(500).json({message: 'Error creating user: '+ error.message});
        }
    }
})
//login
router.put('/login', async(req, res) => {
    try {
        const {username, password} = req.body;
        if(!username || !password) {
            return res.status(400).json({message: 'bad request: username and password are required.'})
        }
        const fetchedUser = await userActions.getUser(username, password);//this is an object having the record from db i.e {id, username, password}
        //creating token 
        const generatedToken = generateJWT(fetchedUser.id, fetchedUser.username); //sending this generated token to the frontend to save it in local storage and for furthur request by the user, this token is sent by them. 
        return res.status(201).json({token: generatedToken, username: fetchedUser.username});
    } catch(error) {
        if(error.message === 'Invalid username or password') {
            return res.status(400).json({message: error.message});
        } else if(error.message === 'User doesnt exist.') {
            return res.status(401).json({message: error.message});
        } else {
            return res.status(500).json({message: 'error during login ' + error.message})
        }
    }
});
export default router;