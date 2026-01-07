import logger from '#config/logger.js';
import {
  getAllUsers,
  getUserById as getUserByIdService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
} from '#services/user.service.js';
import { updateUserSchema, userIdSchema } from '#validations/users.validation.js';
import { formatValidationError } from '#utils/format.js';

export const fetchAllUsers = async (req, res, next) => {
  try {
    logger.info('Getting users from database');

    const allUsers = await getAllUsers();

    res.json({
      users: allUsers,
      message: 'All users are retrieved successfully',
      count: allUsers.length,
    });
  } catch (e) {
    logger.error('Error fetching all users', e);
    next(e);
  }
};

export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse({ id: req.params.id });

    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error),
      });
    }

    const { id } = validationResult.data;

    logger.info(`Getting user ${id} from database`);

    const user = await getUserByIdService(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user,
      message: 'User retrieved successfully',
    });
  } catch (e) {
    logger.error('Error fetching user by id', e);
    next(e);
  }
};

export const updateUserById = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idResult = userIdSchema.safeParse({ id: req.params.id });

    if (!idResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idResult.error),
      });
    }

    const bodyResult = updateUserSchema.safeParse(req.body);

    if (!bodyResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(bodyResult.error),
      });
    }

    const { id } = idResult.data;
    const updates = { ...bodyResult.data };

    const authenticatedUserId = req.user.id;
    const authenticatedUserRole = req.user.role;

    if (authenticatedUserRole !== 'admin' && authenticatedUserId !== id) {
      return res
        .status(403)
        .json({ error: 'Forbidden: you can only update your own profile' });
    }

    if (typeof updates.role !== 'undefined' && authenticatedUserRole !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: only admin can change user role' });
    }

    logger.info(`Updating user ${id} by user ${authenticatedUserId}`);

    try {
      const updatedUser = await updateUserService(id, updates);

      res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser,
      });
    } catch (e) {
      if (e.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }

      throw e;
    }
  } catch (e) {
    logger.error('Error updating user', e);
    next(e);
  }
};

export const deleteUserById = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const idResult = userIdSchema.safeParse({ id: req.params.id });

    if (!idResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(idResult.error),
      });
    }

    const { id } = idResult.data;

    const authenticatedUserId = req.user.id;
    const authenticatedUserRole = req.user.role;

    const isOwnAccount = authenticatedUserId === id;

    if (!isOwnAccount && authenticatedUserRole !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Forbidden: you can only delete your own account' });
    }

    logger.info(`Deleting user ${id} by user ${authenticatedUserId}`);

    try {
      await deleteUserService(id);

      res.status(200).json({ message: 'User deleted successfully' });
    } catch (e) {
      if (e.message === 'User not found') {
        return res.status(404).json({ error: 'User not found' });
      }

      throw e;
    }
  } catch (e) {
    logger.error('Error deleting user', e);
    next(e);
  }
};
