import { searchBook, getBookDetail } from "../service/openLibraryService.js";
import db from "../config/db.js";

// GET /api/books/search?q=keyword&page=1
export const search = async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;
    if (!q?.trim()) {
      const err = new Error("Keyword q khong duoc de trong");
      err.status = 400;
      return next(err);
    }
    const data = await searchBook(q.trim(), Number(page));

    // Danh dau sach da co trong tu (badge "Da them" tren FE)
    const workIds = (data.docs || [])
      .map((d) => d.key?.replace('/works/', ''))
      .filter(Boolean);
    let addedIds = [];
    if (workIds.length > 0) {
      addedIds = await db('library_books').whereIn('work_id', workIds).pluck('work_id');
    }
    const addedSet = new Set(addedIds);
    data.docs = (data.docs || []).map((d) => ({
      ...d,
      isAdded: addedSet.has(d.key?.replace('/works/', '')),
    }));

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:workId
export const getDetail = async (req, res, next) => {
  try {
    const { workId } = req.params;
    if (!workId) {
      const err = new Error("workId phai ton tai");
      err.status = 400;
      return next(err);
    }
    const data = await getBookDetail(workId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};