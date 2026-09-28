import express from 'express';
import { search, getDetail } from '../controller/openLibraryController.js';

const router = express.Router();
router.get('/search', search);
router.get('/:workId', getDetail);

export default router;