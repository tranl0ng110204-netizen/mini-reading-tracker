import express from 'express';
import { list, getOne, create, modify, remove } from '../controller/userController.js';

const router = express.Router();
router.get('/', list);             // GET /api/library?status=...
router.post('/', create);          // POST /api/library
router.get('/:id', getOne);        // GET /api/library/:id
router.patch('/:id', modify);      // PATCH /api/library/:id
router.delete('/:id', remove);     // DELETE /api/library/:id

export default router;