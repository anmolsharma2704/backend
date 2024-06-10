import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import fileUpload from 'express-fileupload';
import path from 'path';
import errorMiddleware from './middleware/error.js';
import { config } from 'dotenv';


export const app = express();

if (process.env.NODE_ENV !== 'PRODUCTION') {
  config({
    path: './data/config.env',
  });
}

// Using Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

// Route Imports
import product from './routes/productRoute.js';
import user from './routes/userRoute.js';
import order from './routes/orderRoute.js';
import payment from './routes/paymentRoute.js';

app.use('/api/v1', product);
app.use('/api/v1', user);
app.use('/api/v1', order);
app.use('/api/v1', payment);

// Using routes
app.get('/', (req, res) => {
  res.send(process.env.COMPANY_NAME);
});

// Using Error Middleware
app.use(errorMiddleware);

export default app;
