import crypto from 'crypto'; // node js built in
const secret = crypto.randomBytes(64).toString('hex');
console.log(secret);