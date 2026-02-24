import express from 'express'
import logRegRoutes from './routes/logReg.js'
import messageRoutes from './routes/messages.js'
import { authenticateToken } from './middleware/midlewre.js';
import cors from 'cors';
const app = express();
app.use(express.json()); //use this middleware only once for .entire app.. no need to defined in individual pages/files(that requires body content to be parse into json). 
app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, Postman)
    if (!origin) return callback(null, true);

    if (
      origin === "http://localhost:5173" ||
      origin.endsWith(".netlify.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use('/api/auth',logRegRoutes);
app.use('/api/auth/msg', authenticateToken, messageRoutes)
app.use('/api/users', messageRoutes);

app.get('/', (req, res) => {
    res.status(200).send({status: 'ok', message: 'welcome'});
})

export default app;