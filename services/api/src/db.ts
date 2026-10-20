import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Check services/api/.env');
}

const sql = postgres(connectionString, {
  prepare: false,
  idle_timeout: 20,
  max: 5,
});

export default sql;