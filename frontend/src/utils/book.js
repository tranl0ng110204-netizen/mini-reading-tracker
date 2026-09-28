export const COVER_BASE_URL = 'https://covers.openlibrary.org/b/id';

export const coverUrl = (coverId, size = 'M') =>
  coverId ? `${COVER_BASE_URL}/${coverId}-${size}.jpg` : '';

export const STATUS_META = {
  WANT_TO_READ: { label: 'Muốn đọc', color: 'default' },
  READING: { label: 'Đang đọc', color: 'processing' },
  READ: { label: 'Đã đọc', color: 'success' },
};

export const STATUS_OPTIONS = Object.entries(STATUS_META).map(([value, meta]) => ({
  value,
  label: meta.label,
}));

export const statusLabel = (status) => STATUS_META[status]?.label ?? status;
export const statusColor = (status) => STATUS_META[status]?.color ?? 'default';

// Sach khong co total_pages (Open Library thieu du lieu) thi khong tinh progress
export const hasProgress = (book) => Number(book.total_pages) > 0;

export const progressPercent = (book) => {
  if (!hasProgress(book)) return 0;
  return Math.min(100, Math.round((book.current_page / book.total_pages) * 100));
};

export const workIdFromKey = (key = '') => key.replace('/works/', '');
