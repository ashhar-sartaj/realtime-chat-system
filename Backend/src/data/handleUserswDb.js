import bcrypt from 'bcrypt'
import { pool } from '../db/db.js'
export const userActions = {
    createUser: async (username, password) => {
        //check if user exist
        const [existingUsers] =  await pool.execute('SELECT username FROM users WHERE username=?', [username]);
        if(existingUsers.length > 0) {
            //one or more users with provided username
            throw new Error('Username already exist. Provide different username.')
        }
        const hashedPassword =  await bcrypt.hash(password, 6); //hashes the password
        //puts the username and password in the database
        await pool.execute('INSERT INTO users(username, password) VALUES(?, ?)', [username, hashedPassword]);
        return {username};
    },
    getUser: async (username, password) => {
        //checking if the provided username exists
        const [rows] = await pool.execute('SELECT * FROM users WHERE username=?', [username]);
        if(rows.length === 0) {
            throw new Error("User doesnt exist.")
        }
        //if reached here means row contains some record
        const fetchedUser = rows[0]; //this is an object having the record from db i.e {id, username, password}
        //verifying the passowrd
        const isValidPassword = await bcrypt.compare(password, fetchedUser.password); 
        if(!isValidPassword) { //means passowrd not matched
            throw new Error('Invalid username or password')
        }
        return fetchedUser;
    },
    // deleteUser: () => {}  //can implement this functionality where valid can basically request the deletion of its user (but only when it is logged in). Provide some functionality in its dashboard to request for deletion of its user. 
    saveMessage: ({}) => {

    }
}
