import db from "../config/db.js";

// lay sach trong DB
export const getAllBooks = async (status) => {
  let query = db('library_books').select('*').orderBy('updated_at', 'desc');
  if (status) {
    query = query.where('status', status);
  }
  return await query;
};

// lay sach trong DB theo ID cua sach
export const getBookById = async (id) => {
  return await db('library_books').where({ id }).first();
};

// Kiem tra sach da ton tai trong DB chua
export const checkDuplicate = async (workId) => {
  const existing = await db('library_books').where('work_id', workId).first();
  return !!existing;
};

// Them sach moi vao DB
export const addBook = async (bookData) => {
  const [id] = await db('library_books').insert({
    work_id: bookData.work_id,
    title: bookData.title,
    authors: bookData.authors || null,
    cover_id: bookData.cover_id,
    publish_year: bookData.publish_year || null,
    total_pages: bookData.total_pages,
    subjects: bookData.subjects,
    status: bookData.status || 'WANT_TO_READ',
    started_at: bookData.status === 'READING' || bookData.status === 'READ' ? db.fn.now() : null,
    completed_at: bookData.status === 'READ' ? db.fn.now() : null,
    current_page: bookData.status === 'READ' ? bookData.total_pages : 0,
  });
  return await getBookById(id);
};

// Cap nhat tien do cua cuon sach
export const updateBook = async (id, currentBook, updateData) => {
  let { status, current_page, rating, note } = updateData;
  let started_at = currentBook.started_at;
  let completed_at = currentBook.completed_at;

  // LOGIC 1: Tu dong chuyen Da doc neu so trang hien tai = tong so trang
  if (current_page !== undefined && current_page === currentBook.total_pages && currentBook.total_pages > 0) {
    status = 'READ';
  }

  // LOGIC 2: Xu ly thay doi thoi gian (State Machine)
  if (status && status !== currentBook.status) {
    // Tu "Muon doc" -> "Dang doc"
    if (status === 'READING' && currentBook.status === 'WANT_TO_READ') {
      started_at = db.fn.now();
    }
    // Chuyen sang "Da doc"
    if (status === 'READ') {
      completed_at = db.fn.now();
      if (!started_at) started_at = db.fn.now();
      current_page = currentBook.total_pages;
    }
    // Lui tu "Da doc" ve "Dang doc"
    if (status === 'READING' && currentBook.status === 'READ') {
      completed_at = null;
    }
  }

  // Thuc thi Update
  await db('library_books').where({ id }).update({
    status: status !== undefined ? status : currentBook.status,
    current_page: current_page !== undefined ? current_page : currentBook.current_page,
    rating: rating !== undefined ? rating : currentBook.rating,
    note: note !== undefined ? note : currentBook.note,
    started_at,
    completed_at,
    updated_at: db.fn.now()
  });
  return await getBookById(id);
};

// Xoa sach
export const deleteBook = async (id) => {
  return await db('library_books').where({ id }).del();
};
