import axios from 'axios';

const BASE_URL = 'https://openlibrary.org';

export const searchBook = async (keyword, page = 1, limit = 20) => {
  try {
    const res = await axios.get(
      `${BASE_URL}/search.json?q=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`
    );
    return res.data;
  } catch (error) {
    const err = new Error('Khong the ket noi toi Open Library API');
    err.status = 502;
    throw err;
  }
};

// Lay ten tac gia tu danh sach key /authors/OL...A
const getAuthorNames = async (authorRefs) => {
  try {
    const keys = authorRefs.map((a) => a.author?.key).filter(Boolean).slice(0, 5);
    const results = await Promise.all(
      keys.map((key) =>
        axios
          .get(`${BASE_URL}${key}.json`)
          .then((r) => r.data.name)
          .catch(() => null)
      )
    );
    return results.filter(Boolean).join(', ');
  } catch {
    return '';
  }
};

// Work cua OL khong co number_of_pages / nam xuat ban -> lay tu editions
const getEditionInfo = async (workId) => {
  try {
    const res = await axios.get(`${BASE_URL}/works/${workId}/editions.json`, {
      params: { limit: 50 },
    });
    const entries = res.data.entries ?? [];
    const withPages = entries.find((e) => e.number_of_pages > 0);

    const years = entries
      .map((e) => String(e.publish_date ?? '').match(/\d{4}/)?.[0])
      .filter(Boolean)
      .map(Number);

    return {
      total_pages: withPages ? withPages.number_of_pages : 0,
      publish_year: years.length > 0 ? Math.min(...years) : null,
    };
  } catch {
    return { total_pages: 0, publish_year: null };
  }
};

export const getBookDetail = async (workId) => {
  try {
    const res = await axios.get(`${BASE_URL}/works/${workId}.json`);
    const data = res.data;

    const [authors, editionInfo] = await Promise.all([
      Array.isArray(data.authors) ? getAuthorNames(data.authors) : Promise.resolve(''),
      getEditionInfo(workId),
    ]);

    const covers = (data.covers || []).filter((c) => c > 0);
    const firstPublish =
      data.first_publish_date?.match(/\d{4}/)?.[0] ?? null;

    return {
      work_id: workId,
      title: data.title || 'Khong co tieu de',
      authors,
      cover_id: covers.length > 0 ? String(covers[0]) : null,
      publish_year: firstPublish ? Number(firstPublish) : editionInfo.publish_year,
      description:
        typeof data.description === 'object' && data.description !== null
          ? data.description.value
          : data.description || null,
      subjects: data.subjects ? data.subjects.slice(0, 5).join(', ') : '',
      total_pages: editionInfo.total_pages,
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const err = new Error('Khong tim thay sach tren Open Library');
      err.status = 404;
      throw err;
    }
    const err = new Error('Loi khi lay chi tiet sach tu Open Library');
    err.status = 502;
    throw err;
  }
};
