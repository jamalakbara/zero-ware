import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as auth from './schema/auth';
import * as studies from './schema/studies';

// Create connection pool for better performance and connection management
const pool = mysql.createPool({
    uri: process.env.DATABASE_URL!,
    connectionLimit: 10,
});

export const db = drizzle(pool);

export const schema = {
    ...auth,
    ...studies,
};