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

// Suy ra trang thai tu so trang da doc:
// full trang = READ, co tien do = READING, chua doc trang nao = khong du de ket luan
const deriveStatusFromProgress = (page, totalPages) => {
  if (totalPages > 0 && page === totalPages) return 'READ';
  if (page > 0) return 'READING';
  return null;
};

// Cap nhat tien do cua cuon sach
export const updateBook = async (id, currentBook, updateData) => {
  const { rating, note } = updateData;
  let { status, current_page } = updateData;
  let started_at = currentBook.started_at;
  let completed_at = currentBook.completed_at;

  if (status === 'WANT_TO_READ') {
    // Chua doc thi khong the co tien do hay thoi diem bat dau
    current_page = 0;
    started_at = null;
    completed_at = null;
  } else {
    // Tien do quyet dinh trang thai (uu tien hon status gui len),
    // tru khi nguoi dung chu dong chon WANT_TO_READ (nhanh tren)
    if (current_page !== undefined) {
      const derived = deriveStatusFromProgress(current_page, currentBook.total_pages);
      if (derived) status = derived;
    }

    const nextStatus = status !== undefined ? status : currentBook.status;
    const statusChanged = nextStatus !== currentBook.status;

    // Chi cap nhat moc thoi gian khi trang thai that su doi,
    // tranh day completed_at len moi lan chi sua note/rating
    if (statusChanged && nextStatus === 'READ') {
      if (currentBook.total_pages > 0) current_page = currentBook.total_pages;
      completed_at = db.fn.now();
      if (!started_at) started_at = db.fn.now();
    }
    if (statusChanged && nextStatus === 'READING') {
      completed_at = null;
      if (!started_at) started_at = db.fn.now();
    }

    status = nextStatus;
  }

  // Thuc thi Update
  await db('library_books').where({ id }).update({
    status,
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
