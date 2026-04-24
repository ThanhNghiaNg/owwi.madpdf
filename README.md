# MadPDF

MadPDF is a lightweight web app for compressing PDF files with Ghostscript.
It provides a simple browser UI, drag-and-drop upload, configurable DPI, upload progress feedback, multilingual copy, and direct download of the compressed file.

## Features

- Compress PDF files from the browser
- Drag-and-drop upload
- AJAX upload with progress indicator
- Adjustable DPI from `0` to `300`
- Ghostscript-based PDF compression
- Download compressed files directly from the UI
- Unicode-safe filename handling for downloaded files
- Automatic temporary file cleanup
- Multilingual UI:
  - Vietnamese
  - English
  - Traditional Chinese
  - Simplified Chinese
  - Korean
  - Japanese

## Tech Stack

- Node.js
- Express
- Multer
- Ghostscript
- Vanilla JavaScript

## Requirements

- Node.js 20+ or newer
- Ghostscript installed and available as `gs`

Check Ghostscript:

```bash
gs --version
```

## Getting Started

### Install dependencies

```bash
npm install
```

### Install Ghostscript

Ubuntu / Debian:

```bash
sudo apt update
sudo apt install ghostscript
```

### Run in development

```bash
npm run dev
```

### Run in production mode

```bash
npm start
```

Default URL:

```text
http://localhost:5175
```

## Docker

The project includes:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`

### Start with Docker Compose

```bash
docker compose up -d --build
```

### View logs

```bash
docker compose logs -f
```

### Stop

```bash
docker compose down
```

Default URL:

```text
http://localhost:5175
```

## API

### `GET /api/status`

Returns app and Ghostscript status.

Example response:

```json
{
  "ok": true,
  "gsReady": true,
  "locale": "en"
}
```

### `POST /api/compress`

Compresses an uploaded PDF.

Form fields:

- `pdf`: PDF file
- `dpi`: integer from `0` to `300`
- `locale`: UI locale such as `vi`, `en`, `zh-TW`, `zh-CN`, `ko`, `ja`

Example success response:

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

## How It Works

1. Upload a PDF from the browser
2. The frontend sends the file to `POST /api/compress`
3. The server maps the requested DPI to an appropriate Ghostscript profile
4. Ghostscript writes a compressed output PDF
5. The app returns compression stats and a download URL
6. The client downloads the result directly from the UI

## Notes

- Scanned PDFs and image-heavy PDFs typically compress better than text/vector-only PDFs.
- Lower DPI usually reduces file size more aggressively, but may reduce image quality.
- A DPI value of `0` is accepted by the app, but the backend still applies a safe internal minimum when invoking Ghostscript.
- Temporary uploaded and generated files are removed automatically after download or expiry.

## Project Structure

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

## License

MIT
