const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 5175;

const tempRoot = path.join(os.tmpdir(), 'madpdf');
const uploadDir = path.join(tempRoot, 'uploads');
const outputDir = path.join(tempRoot, 'outputs');

for (const dir of [tempRoot, uploadDir, outputDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('Chỉ hỗ trợ file PDF.'));
    }
    cb(null, true);
  },
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function clampDpi(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return 150;
  return Math.max(0, Math.min(300, parsed));
}

function compressionProfileForDpi(dpi) {
  if (dpi <= 72) return '/screen';
  if (dpi <= 150) return '/ebook';
  if (dpi <= 220) return '/printer';
  return '/prepress';
}

function runGhostscript(args) {
  return new Promise((resolve, reject) => {
    const child = spawn('gs', args);
    let stderr = '';
    let stdout = '';

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new Error('Ghostscript (gs) chưa được cài trên máy chủ. Hãy cài gs rồi chạy lại.'));
        return;
      }
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || stdout || `Ghostscript thoát với mã ${code}`));
    });
  });
}

async function removeFileSafe(filePath) {
  if (!filePath) return;
  try {
    await fsp.unlink(filePath);
  } catch (_error) {
    // ignore cleanup errors
  }
}

async function ghostscriptAvailable() {
  try {
    await runGhostscript(['-version']);
    return true;
  } catch (_error) {
    return false;
  }
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let index = 0;
  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function cleanupLater(...filePaths) {
  setTimeout(() => {
    for (const filePath of filePaths) {
      removeFileSafe(filePath);
    }
  }, 10 * 60 * 1000).unref();
}

function normalizeUploadedFileName(value) {
  const input = String(value || '').trim();
  if (!input) return 'download.pdf';

  try {
    const repaired = Buffer.from(input, 'latin1').toString('utf8').trim();
    if (repaired && !repaired.includes('�')) {
      return repaired;
    }
  } catch (_error) {
    // ignore and keep original
  }

  return input;
}

function sanitizeDownloadName(value) {
  const baseName = path.basename(String(value || 'download.pdf')).trim() || 'download.pdf';
  return baseName.replace(/[\r\n"]/g, '_');
}

function asciiFallbackFileName(fileName) {
  const parsed = path.parse(fileName);
  const safeBase = (parsed.name || 'download')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^[_\.]+|[_\.]+$/g, '') || 'download';
  const safeExt = (parsed.ext || '.pdf').replace(/[^a-zA-Z0-9.]/g, '') || '.pdf';
  return `${safeBase}${safeExt}`;
}

function buildContentDisposition(fileName) {
  const safeName = sanitizeDownloadName(fileName);
  const fallbackName = asciiFallbackFileName(safeName);
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

async function compressPdf({ file, dpi: rawDpi }) {
  const dpi = clampDpi(rawDpi);
  const profile = compressionProfileForDpi(dpi);
  const inputPath = file.path;
  const normalizedOriginalName = normalizeUploadedFileName(file.originalname);
  const safeBaseName = path.parse(normalizedOriginalName).name.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'compressed';
  const outputName = `${safeBaseName}-${crypto.randomUUID()}.pdf`;
  const outputPath = path.join(outputDir, outputName);

  const gsArgs = [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-dPDFSETTINGS=${profile}`,
    '-dDownsampleColorImages=true',
    '-dDownsampleGrayImages=true',
    '-dDownsampleMonoImages=true',
    '-dColorImageDownsampleType=/Bicubic',
    '-dGrayImageDownsampleType=/Bicubic',
    '-dMonoImageDownsampleType=/Subsample',
    `-dColorImageResolution=${dpi || 1}`,
    `-dGrayImageResolution=${dpi || 1}`,
    `-dMonoImageResolution=${dpi || 1}`,
    `-sOutputFile=${outputPath}`,
    inputPath,
  ];

  try {
    await runGhostscript(gsArgs);

    const [originalStats, compressedStats] = await Promise.all([
      fsp.stat(inputPath),
      fsp.stat(outputPath),
    ]);

    const savedBytes = Math.max(0, originalStats.size - compressedStats.size);
    const savedPercent = originalStats.size > 0
      ? Number((((originalStats.size - compressedStats.size) / originalStats.size) * 100).toFixed(1))
      : 0;

    cleanupLater(inputPath, outputPath);

    return {
      fileName: outputName,
      originalName: normalizedOriginalName,
      dpi,
      originalBytes: originalStats.size,
      compressedBytes: compressedStats.size,
      savedBytes,
      savedPercent,
      originalSize: formatBytes(originalStats.size),
      compressedSize: formatBytes(compressedStats.size),
      savedSize: formatBytes(savedBytes),
      downloadUrl: `/download/${encodeURIComponent(outputName)}?name=${encodeURIComponent(normalizedOriginalName)}`,
    };
  } catch (error) {
    await removeFileSafe(inputPath);
    await removeFileSafe(outputPath);
    throw error;
  }
}

function renderPage({ gsReady = false, error = '' }) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MadPDF — Smart PDF Compression by DPI</title>
  <meta name="description" content="Compress PDF trực tiếp trên web với DPI tùy chỉnh, upload bằng drag & drop và tải file sau nén ngay lập tức." />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css" />
</head>
<body data-gs-ready="${gsReady ? 'true' : 'false'}">
  <div class="bg-orb orb-a"></div>
  <div class="bg-orb orb-b"></div>
  <div class="bg-grid"></div>

  <main class="page">
    <section class="hero-shell">
      <div class="hero-copy">
        <p class="eyebrow">MadPDF • Product MVP</p>
        <h1>Compress PDF by DPI, fast and clean.</h1>
        <p class="subtitle">Upload PDF, chọn DPI từ 0 đến 300, theo dõi tiến trình upload theo thời gian thực và tải file đã nén ngay sau khi xử lý xong.</p>
        <div class="status ${gsReady ? 'ok' : 'bad'}">
          <span class="dot"></span>
          ${gsReady ? 'Ghostscript sẵn sàng' : 'Ghostscript chưa cài'}
        </div>
      </div>
    </section>

    ${!gsReady ? `
      <section class="card notice warning" id="gs-warning">
        <div>
          <h2>Thiếu Ghostscript (gs)</h2>
          <p>Engine nén PDF hiện dùng Ghostscript. App vẫn lên giao diện bình thường nhưng chưa thể xử lý file cho tới khi cài xong.</p>
        </div>
        <pre>sudo apt update && sudo apt install ghostscript</pre>
      </section>
    ` : ''}

    ${error ? `
      <section class="card notice error">
        <h2>Thông báo lỗi</h2>
        <p>${escapeHtml(error)}</p>
      </section>
    ` : ''}

    <section class="card app-shell">
      <div class="panel-head">
        <div>
          <p class="section-kicker">Compression Console</p>
          <h2>Upload & optimize</h2>
        </div>
        <div class="pill-row">
          <span class="pill">Max file: 100MB</span>
          <span class="pill">PDF only</span>
        </div>
      </div>

      <form class="form" id="compress-form" novalidate>
        <label class="dropzone" id="dropzone">
          <input type="file" name="pdf" accept="application/pdf,.pdf" required id="pdf-input" />
          <div class="dropzone-icon">PDF</div>
          <div>
            <strong>Kéo thả PDF vào đây</strong>
            <span>hoặc bấm để chọn file từ máy</span>
          </div>
          <p id="selected-file">Chưa chọn file nào</p>
        </label>

        <div class="control-grid">
          <label class="field">
            <span>DPI (0 - 300)</span>
            <input type="number" name="dpi" min="0" max="300" step="1" value="150" required id="dpi-input" />
            <small>DPI thấp hơn thường nén mạnh hơn nhưng có thể giảm chất lượng ảnh.</small>
          </label>

          <div class="tips-box">
            <span class="label">Gợi ý nhanh</span>
            <p>Từ 0 đến 300, càng nhỏ thì file size càng nhỏ nhưng chất lượng cũng càng kém.</p>
          </div>
        </div>

        <div class="actions">
          <button type="submit" class="button" id="submit-button" ${gsReady ? '' : 'disabled'}>
            <span>Compress PDF</span>
          </button>
          <p class="helper">Sau khi xử lý xong, bạn sẽ nhận link tải ngay tại đây.</p>
        </div>

        <section class="progress-card hidden" id="progress-card" aria-live="polite">
          <div class="progress-top">
            <strong id="progress-label">Đang upload...</strong>
            <span id="progress-percent">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p id="progress-note">Chuẩn bị gửi file lên server...</p>
        </section>

        <section class="notice error hidden" id="error-card">
          <h2>Không thể xử lý</h2>
          <p id="error-message"></p>
        </section>

        <section class="result hidden" id="result-card">
          <div class="result-inline">
            <div class="result-copy">
              <strong id="result-file-name">-</strong>
              <p>File sau nén <span id="stat-compressed-size">-</span> • Tiết kiệm <span id="stat-saved-percent">-</span></p>
            </div>
            <a class="button secondary download-button" id="download-link" href="#" aria-label="Tải về">
              <span class="button-icon" aria-hidden="true">↓</span>
              <span>Tải về</span>
            </a>
          </div>
        </section>
      </form>
    </section>
  </main>

  <script>window.__MADPDF__ = ${JSON.stringify({ gsReady })};</script>
  <script src="/app.js"></script>
</body>
</html>`;
}

app.get('/', async (_req, res) => {
  const gsReady = await ghostscriptAvailable();
  res.send(renderPage({ gsReady }));
});

app.get('/api/status', async (_req, res) => {
  const gsReady = await ghostscriptAvailable();
  res.json({ ok: true, gsReady });
});

app.post('/api/compress', upload.single('pdf'), async (req, res) => {
  const gsReady = await ghostscriptAvailable();

  if (!gsReady) {
    if (req.file) await removeFileSafe(req.file.path);
    res.status(503).json({
      ok: false,
      error: 'Máy chủ chưa cài Ghostscript (gs), nên chưa thể nén PDF.',
      code: 'GS_MISSING',
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      ok: false,
      error: 'Bạn chưa chọn file PDF.',
      code: 'FILE_REQUIRED',
    });
    return;
  }

  try {
    const result = await compressPdf({ file: req.file, dpi: req.body.dpi });
    res.json({ ok: true, result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message || 'Không thể nén PDF.',
      code: 'COMPRESS_FAILED',
    });
  }
});

app.post('/compress', upload.single('pdf'), async (req, res) => {
  const gsReady = await ghostscriptAvailable();

  if (!gsReady) {
    if (req.file) await removeFileSafe(req.file.path);
    res.status(503).send(renderPage({ gsReady }));
    return;
  }

  if (!req.file) {
    res.status(400).send(renderPage({ gsReady }));
    return;
  }

  try {
    const result = await compressPdf({ file: req.file, dpi: req.body.dpi });
    res.redirect(result.downloadUrl);
  } catch (_error) {
    res.status(500).send(renderPage({ gsReady }));
  }
});

app.get('/download/:fileName', async (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const filePath = path.join(outputDir, fileName);
  const requestedName = sanitizeDownloadName(normalizeUploadedFileName(req.query.name || fileName));

  try {
    await fsp.access(filePath, fs.constants.R_OK);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', buildContentDisposition(requestedName));
    res.sendFile(filePath, async (error) => {
      if (!error) {
        await removeFileSafe(filePath);
      }
    });
  } catch (_error) {
    res.status(404).send('File không tồn tại hoặc đã hết hạn.');
  }
});

app.use((error, _req, res, _next) => {
  const isApi = (_req.originalUrl || '').startsWith('/api/');
  const message = error instanceof multer.MulterError
    ? 'Upload thất bại. Kiểm tra lại dung lượng hoặc file PDF.'
    : (error.message || 'Đã có lỗi xảy ra.');

  if (isApi) {
    res.status(400).json({ ok: false, error: message, code: 'UPLOAD_ERROR' });
    return;
  }

  ghostscriptAvailable().then((gsReady) => {
    res.status(400).send(renderPage({ gsReady, error: escapeHtml(message) }));
  }).catch(() => {
    res.status(400).send(renderPage({ gsReady: false, error: escapeHtml(message) }));
  });
});

app.listen(port, () => {
  console.log(`MadPDF is running at http://localhost:${port}`);
});
