import express from 'express'
import logRegRoutes from './routes/logReg.js'
import messageRoutes from './routes/messages.js'
import { authenticateToken } from './middleware/midlewre.js';
import cors from 'cors';
const app = express();
app.use(express.json()); //use this middleware only once for .entire app.. no need to defined in individual pages/files(that requires body content to be parse into json). 
app.use(cors({
  origin: [
    'http://localhost:5173',
    // process.env.FRONTEND_URL //in place of this use: regeex to aviod cors
    /\.netlify\.app$/
  ],
  credentials: true,
}));
app.use('/api/auth',logRegRoutes);
app.use('/api/auth/msg', authenticateToken, messageRoutes)
app.use('/api/users', messageRoutes);

app.get('/', (req, res) => {
    res.status(200).send({status: 'ok', message: 'welcome'});
})

export default app;