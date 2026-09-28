import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRouter from './routes/userRouter.js';
import libraryRoutes from './routes/openLibraryRoute.js';
import errorHandler from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// Middleware chung
// CORS: neu co CORS_ORIGIN (vd khi deploy) thi chi cho phep cac origin do;
// khong co (local dev) thi cho phep tat ca.
// Chuan hoa: trim khoang trang + bo '/' cuoi, vi trinh duoc gui Origin khong co '/' cuoi
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN
      .split(',')
      .map((o) => o.trim().replace(/\/+$/, ''))
      .filter(Boolean)
  : true;
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Mini Reading Tracker API' });
});

// Mount routers
app.use('/api/books', libraryRoutes);    // Proxy Open Library
app.use('/api/library', userRouter);     // CRUD tu sach (MySQL)

// 404 - route not found
app.use((req, res, next) => {
  const err = new Error('Route not found');
  err.status = 404;
  next(err);
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;