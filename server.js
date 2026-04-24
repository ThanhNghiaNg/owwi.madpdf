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

const SUPPORTED_LOCALES = ['vi', 'en', 'zh', 'ko', 'ja'];
const SERVER_MESSAGES = {
  vi: {
    gsMissing: 'Máy chủ chưa cài Ghostscript (gs), nên chưa thể nén PDF.',
    fileRequired: 'Bạn chưa chọn file PDF.',
    compressFailed: 'Không thể nén PDF.',
    uploadFailed: 'Upload thất bại. Kiểm tra lại dung lượng hoặc file PDF.',
    pdfOnly: 'Chỉ hỗ trợ file PDF.',
    expiredFile: 'File không tồn tại hoặc đã hết hạn.',
    unknownError: 'Đã có lỗi xảy ra.',
  },
  en: {
    gsMissing: 'Ghostscript (gs) is not installed on the server yet, so PDF compression is unavailable.',
    fileRequired: 'Please choose a PDF file.',
    compressFailed: 'Unable to compress the PDF.',
    uploadFailed: 'Upload failed. Please check the file size and PDF format.',
    pdfOnly: 'Only PDF files are supported.',
    expiredFile: 'The file does not exist or has expired.',
    unknownError: 'Something went wrong.',
  },
  zh: {
    gsMissing: '服务器尚未安装 Ghostscript (gs)，因此暂时无法压缩 PDF。',
    fileRequired: '请选择一个 PDF 文件。',
    compressFailed: '无法压缩 PDF。',
    uploadFailed: '上传失败。请检查文件大小和 PDF 格式。',
    pdfOnly: '仅支持 PDF 文件。',
    expiredFile: '文件不存在或已过期。',
    unknownError: '发生了错误。',
  },
  ko: {
    gsMissing: '서버에 Ghostscript(gs)가 아직 설치되지 않아 PDF 압축을 사용할 수 없습니다.',
    fileRequired: 'PDF 파일을 선택해 주세요.',
    compressFailed: 'PDF를 압축할 수 없습니다.',
    uploadFailed: '업로드에 실패했습니다. 파일 크기와 PDF 형식을 확인해 주세요.',
    pdfOnly: 'PDF 파일만 지원됩니다.',
    expiredFile: '파일이 없거나 만료되었습니다.',
    unknownError: '오류가 발생했습니다.',
  },
  ja: {
    gsMissing: 'サーバーに Ghostscript (gs) がインストールされていないため、PDF を圧縮できません。',
    fileRequired: 'PDF ファイルを選択してください。',
    compressFailed: 'PDF を圧縮できませんでした。',
    uploadFailed: 'アップロードに失敗しました。ファイルサイズと PDF 形式を確認してください。',
    pdfOnly: 'PDF ファイルのみ対応しています。',
    expiredFile: 'ファイルが存在しないか、有効期限が切れています。',
    unknownError: 'エラーが発生しました。',
  },
};

const tempRoot = path.join(os.tmpdir(), 'madpdf');
const uploadDir = path.join(tempRoot, 'uploads');
const outputDir = path.join(tempRoot, 'outputs');

for (const dir of [tempRoot, uploadDir, outputDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeLocale(value) {
  const input = String(value || '').toLowerCase();
  if (input.startsWith('zh')) return 'zh';
  if (input.startsWith('ko')) return 'ko';
  if (input.startsWith('ja')) return 'ja';
  if (input.startsWith('vi')) return 'vi';
  if (input.startsWith('en')) return 'en';
  return 'en';
}

function serverText(locale, key) {
  const lang = normalizeLocale(locale);
  return SERVER_MESSAGES[lang]?.[key] || SERVER_MESSAGES.en[key] || key;
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      return cb(new Error('PDF_ONLY'));
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
        reject(new Error('GS_MISSING'));
        return;
      }
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(stderr || stdout || `Ghostscript exited with code ${code}`));
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
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MadPDF — Compress PDF by DPI</title>
  <meta name="description" content="Compress PDF directly in the browser with a custom DPI value and instant download." />
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
      <div class="hero-topbar">
        <p class="eyebrow" data-i18n="brand">MadPDF</p>
        <label class="lang-switcher" for="lang-select">
          <span class="sr-only" data-i18n="language">Language</span>
          <select id="lang-select" aria-label="Language">
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
            <option value="zh">中文</option>
            <option value="ko">한국어</option>
            <option value="ja">日本語</option>
          </select>
        </label>
      </div>
      <div class="hero-copy">
        <h1 data-i18n="heroTitle">Compress PDF by DPI</h1>
        <p class="subtitle" data-i18n="heroSubtitle">Upload PDF, choose DPI from 0 to 300, compress as much as you want.</p>
      </div>
    </section>

    ${!gsReady ? `
      <section class="card notice warning" id="gs-warning">
        <div>
          <h2 data-i18n="gsTitle">Ghostscript is missing</h2>
          <p data-i18n="gsBody">The PDF compression engine uses Ghostscript. Install it on the server first to enable processing.</p>
        </div>
        <pre>sudo apt update && sudo apt install ghostscript</pre>
      </section>
    ` : ''}

    ${error ? `
      <section class="card notice error">
        <h2 data-i18n="errorTitle">Error</h2>
        <p>${escapeHtml(error)}</p>
      </section>
    ` : ''}

    <section class="card app-shell">
      <div class="panel-head">
        <div>
          <p class="section-kicker" data-i18n="consoleKicker">Compression Console</p>
          <h2 data-i18n="consoleTitle">Upload & optimize</h2>
        </div>
        <div class="pill-row">
          <span class="pill" data-i18n="maxFile">Max file: 100MB</span>
          <span class="pill" data-i18n="pdfOnly">PDF only</span>
        </div>
      </div>

      <form class="form" id="compress-form" novalidate>
        <label class="dropzone" id="dropzone">
          <input type="file" name="pdf" accept="application/pdf,.pdf" required id="pdf-input" />
          <div class="dropzone-icon">PDF</div>
          <div>
            <strong data-i18n="dropTitle">Drop your PDF here</strong>
            <span data-i18n="dropSubtitle">or click to choose a file</span>
          </div>
          <p id="selected-file" data-i18n="noFile">No file selected</p>
        </label>

        <div class="control-grid single">
          <label class="field field-full">
            <div class="field-head">
              <span data-i18n="dpiLabel">DPI (0 - 300)</span>
              <small data-i18n="dpiHint">Lower DPI reduces file size more, but image quality may drop.</small>
            </div>
            <input type="number" name="dpi" min="0" max="300" step="1" value="50" required id="dpi-input" />
          </label>
        </div>

        <div class="actions">
          <button type="submit" class="button" id="submit-button" ${gsReady ? '' : 'disabled'}>
            <span data-i18n="compressButton">Compress PDF</span>
          </button>
          <p class="helper" data-i18n="helper">After processing, your download link will appear here.</p>
        </div>

        <section class="progress-card hidden" id="progress-card" aria-live="polite">
          <div class="progress-top">
            <strong id="progress-label" data-i18n="uploading">Uploading...</strong>
            <span id="progress-percent">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p id="progress-note" data-i18n="uploadPrepare">Preparing upload...</p>
        </section>

        <section class="notice error hidden" id="error-card">
          <h2 data-i18n="errorTitle">Error</h2>
          <p id="error-message"></p>
        </section>

        <section class="result hidden" id="result-card">
          <div class="result-inline">
            <div class="result-copy">
              <strong id="result-file-name">-</strong>
              <p id="result-summary">Compressed file <span id="stat-compressed-size">-</span> • Saved <span id="stat-saved-percent">-</span></p>
            </div>
            <a class="button secondary download-button" id="download-link" href="#" aria-label="Download">
              <span class="button-icon" aria-hidden="true">↓</span>
              <span data-i18n="download">Download</span>
            </a>
          </div>
        </section>
      </form>
    </section>
  </main>

  <script>window.__MADPDF__ = ${JSON.stringify({ gsReady, supportedLocales: SUPPORTED_LOCALES })};</script>
  <script src="/app.js"></script>
</body>
</html>`;
}

app.get('/', async (_req, res) => {
  const gsReady = await ghostscriptAvailable();
  res.send(renderPage({ gsReady }));
});

app.get('/api/status', async (req, res) => {
  const gsReady = await ghostscriptAvailable();
  const locale = normalizeLocale(req.query.locale);
  res.json({ ok: true, gsReady, locale });
});

app.post('/api/compress', upload.single('pdf'), async (req, res) => {
  const locale = normalizeLocale(req.body?.locale);
  const gsReady = await ghostscriptAvailable();

  if (!gsReady) {
    if (req.file) await removeFileSafe(req.file.path);
    res.status(503).json({ ok: false, error: serverText(locale, 'gsMissing'), code: 'GS_MISSING' });
    return;
  }

  if (!req.file) {
    res.status(400).json({ ok: false, error: serverText(locale, 'fileRequired'), code: 'FILE_REQUIRED' });
    return;
  }

  try {
    const result = await compressPdf({ file: req.file, dpi: req.body.dpi });
    res.json({ ok: true, result, locale });
  } catch (error) {
    const code = error.message === 'GS_MISSING' ? 'GS_MISSING' : 'COMPRESS_FAILED';
    const key = code === 'GS_MISSING' ? 'gsMissing' : 'compressFailed';
    res.status(500).json({ ok: false, error: serverText(locale, key), code });
  }
});

app.post('/compress', upload.single('pdf'), async (req, res) => {
  const locale = normalizeLocale(req.body?.locale);
  const gsReady = await ghostscriptAvailable();

  if (!gsReady) {
    if (req.file) await removeFileSafe(req.file.path);
    res.status(503).send(renderPage({ gsReady, error: serverText(locale, 'gsMissing') }));
    return;
  }

  if (!req.file) {
    res.status(400).send(renderPage({ gsReady, error: serverText(locale, 'fileRequired') }));
    return;
  }

  try {
    const result = await compressPdf({ file: req.file, dpi: req.body.dpi });
    res.redirect(result.downloadUrl);
  } catch (_error) {
    res.status(500).send(renderPage({ gsReady, error: serverText(locale, 'compressFailed') }));
  }
});

app.get('/download/:fileName', async (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const filePath = path.join(outputDir, fileName);
  const requestedName = sanitizeDownloadName(normalizeUploadedFileName(req.query.name || fileName));
  const locale = normalizeLocale(req.query.locale);

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
    res.status(404).send(serverText(locale, 'expiredFile'));
  }
});

app.use((error, req, res, _next) => {
  const locale = normalizeLocale(req.body?.locale || req.query?.locale);
  const isApi = (req.originalUrl || '').startsWith('/api/');
  const key = error instanceof multer.MulterError
    ? 'uploadFailed'
    : error.message === 'PDF_ONLY'
      ? 'pdfOnly'
      : 'unknownError';
  const message = serverText(locale, key);

  if (isApi) {
    res.status(400).json({ ok: false, error: message, code: 'UPLOAD_ERROR' });
    return;
  }

  ghostscriptAvailable().then((gsReady) => {
    res.status(400).send(renderPage({ gsReady, error: message }));
  }).catch(() => {
    res.status(400).send(renderPage({ gsReady: false, error: message }));
  });
});

app.listen(port, () => {
  console.log(`MadPDF is running at http://localhost:${port}`);
});
