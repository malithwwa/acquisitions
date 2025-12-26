import 'dotenv/config';

import { neone } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neone(process.env.DATABASE_URL);

const db = drizzle(sql);

export { db, sql };
