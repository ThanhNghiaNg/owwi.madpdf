# MadPDF

MadPDF is an open-source web app for compressing PDF files with Ghostscript.

It includes a simple browser UI, drag-and-drop upload, configurable DPI, multilingual support, and direct download of the compressed file.

## Features

- PDF compression in the browser
- Drag-and-drop upload
- AJAX upload with progress feedback
- Adjustable DPI from `0` to `300`
- Ghostscript-based compression
- Direct download after processing
- Unicode-safe download filenames
- Automatic temporary file cleanup
- Multilingual UI
  - Vietnamese
  - English
  - Traditional Chinese (Taiwan)
  - Simplified Chinese (Mainland China)
  - Korean
  - Japanese
- Docker support

## Stack

- Node.js
- Express
- Multer
- Ghostscript
- Vanilla JavaScript

## Requirements

### Local run

- Node.js 20+
- Ghostscript available as `gs`

Check Ghostscript:

```bash
gs --version
```

## Quick Start

### Install

```bash
npm install
```

### Run

```bash
npm start
```

App runs at:

```text
http://localhost:5175
```

### Development mode

```bash
npm run dev
```

## Docker

Build and run with Docker Compose:

```bash
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f
```

Stop:

```bash
docker compose down
```

App runs at:

```text
http://localhost:5175
```

## API

### `GET /api/status`

Returns service status.

Example:

```json
{
  "ok": true,
  "gsReady": true,
  "locale": "en"
}
```

### `POST /api/compress`

Compress an uploaded PDF.

Form fields:

- `pdf`: PDF file
- `dpi`: integer from `0` to `300`
- `locale`: UI locale such as `vi`, `en`, `zh-TW`, `zh-CN`, `ko`, `ja`

Example response:

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
    "downloadUrl": "/download/demo-uuid.pdf?name=demo.pdf"
  }
}
```

## Project Structure

```text
.
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

## License

MIT
