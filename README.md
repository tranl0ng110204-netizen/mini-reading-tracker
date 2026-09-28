# Mini Reading Tracker

Ứng dụng quản lý tủ sách cá nhân: tìm sách từ **Open Library**, thêm vào tủ, theo dõi tiến độ đọc (số trang), trạng thái (Muốn đọc / Đang đọc / Đã đọc), đánh giá sao và ghi chú.

## Demo

- Frontend: https://mini-reading-tracker.vercel.app
- Backend API: https://mini-reading-tracker.onrender.com

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Vue 3 (`<script setup>`), Vite, Ant Design Vue 4, Axios, vue-router |
| Backend | Node.js, Express 5 (ESM), Knex, Axios |
| Database | MySQL 8 |
| Data nguồn | [Open Library API](https://openlibrary.org/developers/api) |
| Deploy | Vercel (FE) + Render (BE) + Aiven MySQL (DB) |

## Kiến trúc

```
Browser (Vue 3)
   |  REST /api/*  (axios)
   v
Express Backend (Render)
   |-- /api/books/*   --> proxy Open Library (search, detail) + enrich isAdded/total_pages
   |-- /api/library/* --> CRUD tu sach ca nhan
   v
MySQL (Aiven, khong public)
```

**Frontend không bao giờ gọi Open Library trực tiếp** — backend làm proxy để:
1. Gộp dữ liệu (tên tác giả, số trang từ editions, cờ `isAdded` từ DB) trong 1 response.
2. Giữ URL API nguồn ở một nơi, dễ đổi/thêm cache.

## Database Schema — `library_books`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| id | int auto_increment | PK |
| work_id | varchar(100) | **unique** — ID sách từ Open Library (vd `OL82563W`) |
| title | varchar(255) | not null |
| authors | varchar(255) | tên tác giả, phân cách dấu phẩy |
| cover_id | varchar(50) | ID ảnh bìa Open Library (null nếu không có) |
| publish_year | int | năm xuất bản đầu tiên |
| total_pages | int | default 0 — 0 nghĩa là không rõ số trang |
| subjects | text | tối đa 5 chủ đề |
| status | enum | `WANT_TO_READ` / `READING` / `READ`, default `WANT_TO_READ` |
| current_page | int | default 0, luôn ≤ total_pages |
| rating | int nullable | 1–5 hoặc null |
| note | text nullable | ghi chú cá nhân |
| started_at | datetime nullable | thời điểm chuyển sang READING |
| completed_at | datetime nullable | thời điểm chuyển sang READ |
| created_at / updated_at | datetime | tự quản lý |

## API

Base URL: `http://localhost:3000/api`

### Open Library (proxy)

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/books/search?q=&page=&limit=` | Tìm sách, trả kèm `isAdded` mỗi kết quả |
| GET | `/books/:workId` | Chi tiết sách (tác giả, mô tả, số trang, năm XB) |

### Library (CRUD)

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/library?status=READING` | Danh sách sách (lọc theo status tùy chọn) |
| GET | `/library/:id` | Một sách theo id |
| POST | `/library` | Thêm sách — body `{ work_id, status }`, backend tự lấy chi tiết từ OL. Trùng → **409** |
| PATCH | `/library/:id` | Cập nhật `status` / `current_page` / `rating` / `note` |
| DELETE | `/library/:id` | Xóa sách |

**Response lỗi thống nhất:**
```json
{ "success": false, "message": "...", "errors": [] }
```

## Business Rules (state machine)

**Bất biến:** `WANT_TO_READ` ⇒ `current_page = 0` và `started_at = completed_at = null` — sách chưa đọc thì không thể có tiến độ.

1. **Trạng thái suy ra từ tiến độ** (khi PATCH có `current_page`):
   - `current_page === total_pages && total_pages > 0` → `READ` + `completed_at = now()`
   - `0 < current_page < total_pages` → `READING` + `started_at = now()` nếu chưa có, xóa `completed_at` nếu đang `READ` (trường hợp đọc lại)
   - `current_page = 0` → không đủ căn cứ, giữ nguyên trạng thái
2. **Ưu tiên:** `status` gửi lên chỉ thắng khi nó là **thay đổi thật sự**. Frontend chỉ gửi `status` khi người dùng chủ động đổi dropdown; nếu để nguyên thì tiến độ quyết định. Riêng `status = WANT_TO_READ` luôn thắng và reset `current_page = 0` + xóa 2 mốc thời gian.
3. **Mốc thời gian chỉ cập nhật khi trạng thái thật sự đổi** — sửa mỗi `note`/`rating` của sách `READ` sẽ không đẩy `completed_at` lên.
4. **Sách không rõ số trang** (`total_pages = 0`, Open Library thiếu dữ liệu): không có thanh tiến độ %, không auto-`READ`. Vẫn **nhập được số trang đã đọc** (không giới hạn max) và `current_page > 0` vẫn suy ra `READING`; UI hiển thị dạng "Đã đọc X trang" thay vì `X / Y`. Chọn `READ` thủ công thì giữ nguyên `current_page` (không ép bằng `total_pages` vì không có giá trị đó).
5. **Validate:** `status` phải thuộc enum (400 nếu sai); `0 <= current_page <= total_pages` (400); `rating` là số nguyên 1–5 hoặc null; thêm trùng `work_id` → 409.

## Chạy local

### 1. Backend

```bash
cd backend
cp .env.example .env      # điền thông tin MySQL local
npm install
npx knex migrate:latest   # tạo bảng library_books
node seeds/seed.js        # (tùy chọn) 3 sách mẫu, chạy lại nhiều lần không nhân bản
npm run dev               # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:3000
npm install
npm run dev               # http://localhost:5173
```

### Environment variables

**backend/.env**

| Biến | Mô tả |
|---|---|
| DB_HOST / DB_USER / DB_PASSWORD / DB_NAME / DB_PORT | Kết nối MySQL local |
| DATABASE_URL | MySQL URL khi chạy production (Render/Aiven) |
| PORT | Port server (default 3000) |
| CORS_ORIGIN | Danh sách origin cho phép, phân cách dấu phẩy. Không set → cho phép tất cả (dev) |

**frontend/.env**

| Biến | Mô tả |
|---|---|
| VITE_API_URL | Base URL backend (default `http://localhost:3000`) |

> `.env` nằm trong `.gitignore` — không commit secrets. Xem `.env.example` làm mẫu.

## Deploy

- **DB — Aiven MySQL:** tạo service free, lấy `DATABASE_URL` (SSL).
- **Backend — Render:** Web Service trỏ vào repo, root `backend/`; build `npm install && npx knex migrate:latest`; start `npm start`; env `DATABASE_URL` + `CORS_ORIGIN=<url Vercel>`.
- **Frontend — Vercel:** import repo, root `frontend/`; build `npm run build`, output `dist`; env `VITE_API_URL=<url Render>`; SPA rewrite đã cấu hình trong `vercel.json`.

## Assumptions / Giới hạn

- Mỗi sách chỉ lưu **một bản** (unique `work_id`) — không hỗ trợ sở hữu nhiều copy.
- `total_pages` lấy từ edition đầu tiên có số trang trên Open Library, có thể không khớp edition người dùng đọc; khi đó vẫn cập nhật được tiến độ thủ công trong giới hạn.
- Không có authentication — single user (tủ sách cá nhân).
- Số liệu search phân trang lấy theo `totalFound` của Open Library (ước lượng, không chính xác tuyệt đối).
