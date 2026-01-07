import logger from '#config/logger.js';
import { db } from '#config/database.js';
import { users } from '#models/user.model.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '#services/auth.service.js';

const publicUserSelection = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  created_at: users.created_at,
  updated_at: users.updated_at,
};

export const getAllUsers = async () => {
  try {
    return await db.select(publicUserSelection).from(users);
  } catch (e) {
    logger.error('Error fetching all users', e);
    throw e;
  }
};

export const getUserById = async id => {
  try {
    const [user] = await db
      .select(publicUserSelection)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user || null;
  } catch (e) {
    logger.error(`Error fetching user by id ${id}`, e);
    throw e;
  }
};

export const updateUser = async (id, updates) => {
  try {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    const updatePayload = {};

    if (typeof updates.name !== 'undefined') updatePayload.name = updates.name;
    if (typeof updates.email !== 'undefined')
      updatePayload.email = updates.email;
    if (typeof updates.role !== 'undefined') updatePayload.role = updates.role;

    if (typeof updates.password !== 'undefined') {
      updatePayload.password = await hashPassword(updates.password);
    }

    if (Object.keys(updatePayload).length === 0) {
      return await getUserById(id);
    }

    updatePayload.updated_at = new Date();

    const [updatedUser] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, id))
      .returning(publicUserSelection);

    logger.info(`User ${id} updated successfully`);

    return updatedUser;
  } catch (e) {
    logger.error(`Error updating user ${id}`, e);
    throw e;
  }
};

export const deleteUser = async id => {
  try {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      throw new Error('User not found');
    }

    await db.delete(users).where(eq(users.id, id));

    logger.info(`User ${id} deleted successfully`);
  } catch (e) {
    logger.error(`Error deleting user ${id}`, e);
    throw e;
  }
};
