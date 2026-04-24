const express = require('express');
const multer = require('multer');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

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

function renderPage({ result = null, error = '', form = {}, gsReady = false }) {
  const dpi = typeof form.dpi === 'undefined' ? 150 : clampDpi(form.dpi);
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MadPDF - Compress PDF by DPI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main class="page">
    <section class="card hero">
      <div>
        <p class="eyebrow">Node.js MVP</p>
        <h1>MadPDF</h1>
        <p class="subtitle">Upload PDF, nhập DPI từ 0 đến 300, nén file và tải kết quả ngay.</p>
      </div>
      <div class="status ${gsReady ? 'ok' : 'bad'}">
        <span class="dot"></span>
        ${gsReady ? 'Ghostscript sẵn sàng' : 'Ghostscript chưa cài'}
      </div>
    </section>

    ${!gsReady ? `
      <section class="card notice warning">
        <h2>Thiếu Ghostscript (gs)</h2>
        <p>Engine nén PDF hiện dùng Ghostscript. Trên Ubuntu/Debian bạn có thể cài:</p>
        <pre>sudo apt update && sudo apt install ghostscript</pre>
        <p>Sau khi cài xong, chạy lại app là dùng được.</p>
      </section>
    ` : ''}

    <section class="card">
      <form action="/compress" method="post" enctype="multipart/form-data" class="form" id="compress-form">
        <label class="dropzone" id="dropzone">
          <input type="file" name="pdf" accept="application/pdf,.pdf" required id="pdf-input" />
          <div>
            <strong>Kéo thả PDF vào đây</strong>
            <span>hoặc bấm để chọn file</span>
          </div>
          <p id="selected-file">Chưa chọn file nào</p>
        </label>

        <div class="field-grid">
          <label class="field">
            <span>DPI (0 - 300)</span>
            <input type="number" name="dpi" min="0" max="300" step="1" value="${escapeHtml(dpi)}" required />
            <small>DPI càng thấp thường giảm dung lượng mạnh hơn, nhất là PDF scan/ảnh.</small>
          </label>
        </div>

        <button type="submit" class="button" ${gsReady ? '' : 'disabled'}>Compress PDF</button>
      </form>
    </section>

    ${error ? `
      <section class="card notice error">
        <h2>Lỗi</h2>
        <p>${escapeHtml(error)}</p>
      </section>
    ` : ''}

    ${result ? `
      <section class="card result">
        <h2>Kết quả</h2>
        <div class="stats">
          <div class="stat"><span>File gốc</span><strong>${escapeHtml(result.originalSize)}</strong></div>
          <div class="stat"><span>File sau nén</span><strong>${escapeHtml(result.compressedSize)}</strong></div>
          <div class="stat"><span>Tiết kiệm</span><strong>${escapeHtml(result.savedPercent)}%</strong></div>
          <div class="stat"><span>DPI đã dùng</span><strong>${escapeHtml(result.dpi)}</strong></div>
        </div>
        <a class="button secondary" href="${escapeHtml(result.downloadUrl)}">Tải file PDF đã nén</a>
      </section>
    ` : ''}
  </main>

  <script src="/app.js"></script>
</body>
</html>`;
}

app.get('/', async (_req, res) => {
  const gsReady = await ghostscriptAvailable();
  res.send(renderPage({ gsReady }));
});

app.post('/compress', upload.single('pdf'), async (req, res) => {
  const gsReady = await ghostscriptAvailable();

  if (!gsReady) {
    if (req.file) await removeFileSafe(req.file.path);
    res.status(500).send(renderPage({
      error: 'Máy chủ chưa cài Ghostscript (gs), nên chưa thể nén PDF.',
      form: req.body,
      gsReady,
    }));
    return;
  }

  if (!req.file) {
    res.status(400).send(renderPage({
      error: 'Bạn chưa chọn file PDF.',
      form: req.body,
      gsReady,
    }));
    return;
  }

  const dpi = clampDpi(req.body.dpi);
  const profile = compressionProfileForDpi(dpi);
  const inputPath = req.file.path;
  const outputName = `${path.parse(req.file.originalname).name}-${crypto.randomUUID()}.pdf`;
  const outputPath = path.join(outputDir, outputName);

  try {
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

    await runGhostscript(gsArgs);

    const [originalStats, compressedStats] = await Promise.all([
      fsp.stat(inputPath),
      fsp.stat(outputPath),
    ]);

    const savedPercent = originalStats.size > 0
      ? (((originalStats.size - compressedStats.size) / originalStats.size) * 100).toFixed(1)
      : '0.0';

    setTimeout(() => {
      removeFileSafe(inputPath);
      removeFileSafe(outputPath);
    }, 10 * 60 * 1000).unref();

    res.send(renderPage({
      gsReady,
      result: {
        originalSize: formatBytes(originalStats.size),
        compressedSize: formatBytes(compressedStats.size),
        savedPercent,
        dpi,
        downloadUrl: `/download/${encodeURIComponent(outputName)}`,
      },
      form: { dpi },
    }));
  } catch (error) {
    await removeFileSafe(inputPath);
    await removeFileSafe(outputPath);
    res.status(500).send(renderPage({
      error: error.message || 'Không thể nén PDF.',
      form: { dpi },
      gsReady,
    }));
  }
});

app.get('/download/:fileName', async (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const filePath = path.join(outputDir, fileName);

  try {
    await fsp.access(filePath, fs.constants.R_OK);
    res.download(filePath, fileName, async (error) => {
      if (!error) {
        await removeFileSafe(filePath);
      }
    });
  } catch (_error) {
    res.status(404).send('File không tồn tại hoặc đã hết hạn.');
  }
});

app.use((error, _req, res, _next) => {
  const message = error instanceof multer.MulterError
    ? 'Upload thất bại. Kiểm tra lại dung lượng hoặc file PDF.'
    : (error.message || 'Đã có lỗi xảy ra.');

  ghostscriptAvailable().then((gsReady) => {
    res.status(400).send(renderPage({ error: message, gsReady }));
  }).catch(() => {
    res.status(400).send(renderPage({ error: message, gsReady: false }));
  });
});

app.listen(port, () => {
  console.log(`MadPDF is running at http://localhost:${port}`);
});
