import logger from '#config/logger.js';
import bcrypt from 'bcrypt';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';

export const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (e) {
    logger.error('Error creating new password', e);
    throw new Error('Error hashing');
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (e) {
    logger.error('Error comparing password', e);
    throw new Error('Error comparing password');
  }
};

export const authenticateUser = async ({ email, password }) => {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    return user;
  } catch (e) {
    logger.error(`Error authenticating user ${email}`, e);
    throw e;
  }
};

export const createUser = async ({ name, email, password, role = 'user' }) => {
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

    if (existingUser.length > 0) throw new Error('User already exists');

    const password_hash = await hashPassword(password);
    const [newUser] = await db
      .insert(users)
      .values({ name, email, password: password_hash, role})
      .returning();

    logger.info(`User ${newUser.email} created successfully`);
    return newUser;
  }catch (e) {
    logger.error(`Error creating new user ${e}`);
    throw e;
  }
};