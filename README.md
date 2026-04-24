# MadPDF

Web app nén PDF bằng Node.js với giao diện product-style, upload AJAX, và hỗ trợ đa ngôn ngữ.

## Tính năng

- Upload PDF qua giao diện web hiện đại
- Drag & drop file PDF
- AJAX upload không reload trang
- Progress bar theo tiến trình upload
- Nhập DPI dạng số nguyên từ `0` đến `300`
- Nén PDF bằng Ghostscript khi có sẵn trên máy
- Hỗ trợ đa ngôn ngữ:
  - Tiếng Việt
  - English
  - 繁體中文（台灣）
  - 简体中文（中国大陆）
  - 한국어
  - 日本語
- Hiển thị:
  - dung lượng file sau nén
  - phần trăm tiết kiệm
  - tên file
- Link tải file sau nén ngay trên giao diện
- Tự xóa file tạm sau khi xử lý hoặc sau khi tải
- Báo lỗi rõ ràng nếu máy chưa cài `gs`

## Công nghệ

- Node.js
- Express
- Multer
- Ghostscript (`gs`) để nén PDF
- Frontend vanilla JS + XHR upload progress

## API hiện có

### `GET /api/status`

Trả trạng thái app và kiểm tra Ghostscript.

Ví dụ response:

```json
{
  "ok": true,
  "gsReady": true,
  "locale": "zh-TW"
}
```

### `POST /api/compress`

Upload PDF và nén file.

Form fields:

- `pdf`: file PDF
- `dpi`: số nguyên từ `0` đến `300`
- `locale`: ngôn ngữ hiện tại, ví dụ `vi`, `en`, `zh-TW`, `zh-CN`

Ví dụ response thành công:

```json
{
  "ok": true,
  "result": {
    "fileName": "demo-uuid.pdf",
    "originalName": "demo.pdf",
    "dpi": 150,
    "originalBytes": 5000000,
    "compressedBytes": 1800000,
    "savedBytes": 3200000,
    "savedPercent": 64,
    "originalSize": "4.8 MB",
    "compressedSize": "1.7 MB",
    "savedSize": "3.1 MB",
    "downloadUrl": "/download/demo-uuid.pdf"
  }
}
```

## Cài đặt local

### 1. Cài dependencies

```bash
npm install
```

### 2. Cài Ghostscript

Ubuntu / Debian:

```bash
sudo apt update && sudo apt install ghostscript
```

Kiểm tra:

```bash
gs --version
```

## Chạy app local

### Dev

```bash
npm run dev
```

### Start

```bash
npm start
```

App mặc định chạy tại:

```bash
http://localhost:5175
```

## Chạy bằng Docker

Project đã có sẵn:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

### Build và start

```bash
docker compose up -d --build
```

### Xem log

```bash
docker compose logs -f
```

### Stop

```bash
docker compose down
```

App sẽ chạy tại:

```bash
http://localhost:5175
```

### Ghi chú Docker

- image đã cài sẵn `ghostscript`
- container dùng `node:24-bookworm-slim`
- port mặc định: `5175`
- restart policy: `unless-stopped`

## Cách hoạt động

- Người dùng chọn PDF
- Frontend gửi file bằng AJAX đến `POST /api/compress`
- Progress bar hiển thị tiến trình upload
- Backend map DPI sang profile Ghostscript phù hợp (`/screen`, `/ebook`, `/printer`, `/prepress`)
- Backend đồng thời ép downsample ảnh theo DPI đã nhập
- Server trả JSON kết quả + link download
- Người dùng tải file PDF đã nén trực tiếp từ giao diện

## Lưu ý thực tế

- PDF scan / PDF chứa ảnh sẽ giảm size rõ hơn
- PDF chủ yếu là text/vector có thể giảm rất ít
- DPI quá thấp có thể làm chất lượng ảnh xấu đi
- Với giá trị `0`, app vẫn chấp nhận input nhưng backend sẽ dùng mức tối thiểu an toàn nội bộ khi gọi Ghostscript để tránh lỗi runtime
- Progress bar hiện phản ánh tiến trình upload; sau đó UI chuyển sang trạng thái “đang nén PDF” trong lúc server xử lý

## Cấu trúc

```text
projects/madpdf/
├─ public/
│  ├─ app.js
│  ├─ styles.css
│  └─ locales/
├─ Dockerfile
├─ docker-compose.yml
├─ .dockerignore
├─ package.json
├─ README.md
└─ server.js
```
