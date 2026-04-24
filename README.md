# MadPDF

MVP web app nén PDF bằng Node.js.

## Tính năng

- Upload PDF qua giao diện web
- Kéo thả file PDF
- Nhập DPI dạng số nguyên từ `0` đến `300`
- Nén PDF bằng Ghostscript khi có sẵn trên máy
- Hiển thị dung lượng trước/sau và phần trăm giảm
- Tự xóa file tạm sau khi xử lý hoặc sau khi tải
- Báo lỗi rõ ràng nếu máy chưa cài `gs`

## Công nghệ

- Node.js
- Express
- Multer
- Ghostscript (`gs`) để nén PDF

## Cài đặt

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

## Chạy app

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
http://localhost:3000
```

## Cách hoạt động

- Người dùng upload file PDF
- Nhập DPI từ `0` đến `300`
- Server map DPI sang profile Ghostscript phù hợp (`/screen`, `/ebook`, `/printer`, `/prepress`)
- Đồng thời ép downsample ảnh trong PDF theo DPI đã nhập
- Kết quả được tạo thành file PDF mới cho người dùng tải xuống

## Lưu ý thực tế

- PDF scan / PDF chứa ảnh sẽ giảm size rõ hơn
- PDF chủ yếu là text/vector có thể giảm rất ít
- DPI quá thấp có thể làm chất lượng nhìn xấu đi
- Với giá trị `0`, app vẫn chấp nhận input nhưng backend sẽ dùng mức tối thiểu an toàn nội bộ khi gọi Ghostscript để tránh lỗi runtime

## Cấu trúc

```text
projects/madpdf/
├─ public/
│  ├─ app.js
│  └─ styles.css
├─ package.json
├─ README.md
└─ server.js
```

## Hướng nâng cấp tiếp theo

- AJAX upload + progress bar
- preview metadata PDF
- batch compress nhiều file
- queue xử lý nền
- giới hạn rate limit / IP
- deploy với nginx + pm2
- thêm preset quality ngoài DPI
