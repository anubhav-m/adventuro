import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

export const connectDb = (uri = env.MONGODB_URI) => mongoose.connect(uri);

export const disconnectDb = () => mongoose.disconnect();
