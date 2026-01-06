import express from 'express';

const router = express.Router();

router.get('/', (req, res) => res.send('GET /users '));
router.get('/:id', (req, res) => res.send('GET /user '));
router.put('/:id', (req, res) => res.send('PUT /users '));
router.delete('/', (req, res) => res.send('DELETE /users '));

export default router;