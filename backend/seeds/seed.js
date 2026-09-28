import db from '../src/config/db.js';
import { getBookDetail } from '../src/service/openLibraryService.js';

// Du lieu mau: 3 cuon Harry Potter voi 3 trang thai khac nhau
const SAMPLES = [
  { work_id: 'OL82563W', status: 'READING', current_page: 120, rating: null },
  { work_id: 'OL82537W', status: 'READ', rating: 5 },
  { work_id: 'OL82536W', status: 'WANT_TO_READ', current_page: 0, rating: null },
];

export const seed = async (knex) => {
  for (const sample of SAMPLES) {
    // Idempotent: bo qua neu sach da ton tai trong DB
    const existing = await knex('library_books').where('work_id', sample.work_id).first();
    if (existing) {
      console.log(`[seed] Skip ${sample.work_id} (already exists)`);
      continue;
    }

    // Lay chi tiet that tu Open Library (title, authors, total_pages, ...)
    const detail = await getBookDetail(sample.work_id);

    const now = knex.fn.now();
    await knex('library_books').insert({
      work_id: sample.work_id,
      title: detail.title,
      authors: detail.authors,
      cover_id: detail.cover_id,
      publish_year: detail.publish_year,
      total_pages: detail.total_pages,
      subjects: detail.subjects,
      status: sample.status,
      rating: sample.rating ?? null,
      note: null,
      current_page: sample.status === 'READ' ? detail.total_pages : (sample.current_page ?? 0),
      started_at: sample.status === 'READING' || sample.status === 'READ' ? now : null,
      completed_at: sample.status === 'READ' ? now : null,
    });
    console.log(`[seed] Inserted ${sample.work_id} - ${detail.title} (${sample.status})`);
  }
};

// Chay truc tiep: npx knex seed:run hoac node seeds/seed.js
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  try {
    await seed(db);
    console.log('[seed] Done');
  } catch (err) {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}
