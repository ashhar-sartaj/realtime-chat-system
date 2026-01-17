import express from 'express'
import logRegRoutes from './routes/logReg.js'
import messageRoutes from './routes/messages.js'
import { authenticateToken } from './middleware/midlewre.js';
const app = express();
app.use(express.json()); //use this middleware only once for .entire app.. no need to defined in individual pages/files(that requires body content to be parse into json). 
app.use('/api/auth',logRegRoutes);
app.use('/api/auth/msg', authenticateToken, messageRoutes)
app.get('/', (req, res) => {
    res.status(200).send("GET request made base'/'");
})

export default app;