import { getAllBooks, getBookById, checkDuplicate, addBook, updateBook, deleteBook } from "../service/userService.js";
import { getBookDetail } from "../service/openLibraryService.js";

// GET /api/library?status=READING
export const list = async (req, res, next) => {
  try {
    const { status } = req.query;
    const books = await getAllBooks(status);
    res.json({ success: true, data: books });
  } catch (err) {
    next(err);
  }
};

// GET /api/library/:id
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const book = await getBookById(id);
    if (!book) {
      const err = new Error('Sach khong ton tai trong tu');
      err.status = 404;
      return next(err);
    }
    res.json({ success: true, data: book });
  } catch (err) {
    next(err);
  }
};

// POST /api/library
// body: { work_id: string, status?: 'WANT_TO_READ'|'READING'|'READ' }
export const create = async (req, res, next) => {
  try {
    const { work_id, status = 'WANT_TO_READ' } = req.body;
    if (!work_id) {
      const err = new Error('work_id la truong bat buoc');
      err.status = 400;
      return next(err);
    }
    if (!['WANT_TO_READ', 'READING', 'READ'].includes(status)) {
      const err = new Error('status phai la WANT_TO_READ, READING hoac READ');
      err.status = 400;
      return next(err);
    }
    // check duplicate
    if (await checkDuplicate(work_id)) {
      const err = new Error('Sach da ton tai trong tu');
      err.status = 409;
      return next(err);
    }
    // merge status voi sach
    const olData = await getBookDetail(work_id);
    const payload = {
      ...olData,
      status,
    };
    const saved = await addBook(payload);
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/library/:id
// body: { status?, current_page?, rating?, note? }
export const modify = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate status
    if (updateData.status !== undefined) {
      const ALLOWED_STATUS = ['WANT_TO_READ', 'READING', 'READ'];
      if (!ALLOWED_STATUS.includes(updateData.status)) {
        const err = new Error('status phai la WANT_TO_READ, READING hoac READ');
        err.status = 400;
        return next(err);
      }
    }

    // Validate rating (null = xoa danh gia)
    if (updateData.rating !== undefined && updateData.rating !== null) {
      const r = Number(updateData.rating);
      if (!Number.isInteger(r) || r < 1 || r > 5) {
        const err = new Error('rating phai la so nguyen tu 1-5');
        err.status = 400;
        return next(err);
      }
      updateData.rating = r;
    }

    // Validate current_page
    if (updateData.current_page !== undefined) {
      const cp = Number(updateData.current_page);
      if (!Number.isInteger(cp) || cp < 0) {
        const err = new Error('current_page phai la so nguyen >= 0');
        err.status = 400;
        return next(err);
      }
      updateData.current_page = cp;
    }

    const currentBook = await getBookById(id);
    if (!currentBook) {
      const err = new Error('Sach khong ton tai trong tu');
      err.status = 404;
      return next(err);
    }

    // Kiem tra current_page > total_pages
    if (
      updateData.current_page !== undefined &&
      currentBook.total_pages > 0 &&
      updateData.current_page > currentBook.total_pages
    ) {
      const err = new Error(
        `current_page (${updateData.current_page}) khong duoc lon hon total_pages (${currentBook.total_pages})`
      );
      err.status = 400;
      return next(err);
    }

    const saved = await updateBook(id, currentBook, updateData);
    res.json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/library/:id
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    const affected = await deleteBook(id);
    if (!affected) {
      const err = new Error('Sach khong ton tai');
      err.status = 404;
      return next(err);
    }
    res.json({ success: true, message: 'Xoa sach thanh cong' });
  } catch (err) {
    next(err);
  }
};