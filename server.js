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

function resolveBuildVersion() {
  if (process.env.APP_VERSION && process.env.APP_VERSION.trim()) {
    return process.env.APP_VERSION.trim();
  }

  try {
    const commitHash = fs.readFileSync(path.join(__dirname, '.commit_hash'), 'utf8').trim();
    if (commitHash) return commitHash;
  } catch (_error) {
    // ignore missing file
  }

  return 'dev';
}

const APP_VERSION = resolveBuildVersion();

const SUPPORTED_LOCALES = ['vi', 'en', 'zh-TW', 'zh-CN', 'ko', 'ja'];
const SERVER_MESSAGES = {
  vi: {
    metaTitle: 'MadPDF — Nén PDF theo DPI',
    metaDescription: 'Nén PDF trực tiếp trên web với giá trị DPI tùy chỉnh và tải về ngay.',
    languageLabel: 'Ngôn ngữ',
    gsTitle: 'Thiếu Ghostscript',
    gsBody: 'Công cụ nén PDF dùng Ghostscript. Hãy cài nó trên server trước để bắt đầu xử lý.',
    errorTitle: 'Lỗi',
    consoleKicker: 'Bảng điều khiển nén',
    consoleTitle: 'Tải lên & tối ưu',
    maxFile: 'File tối đa: 100MB',
    pdfOnly: 'Chỉ PDF',
    dropTitle: 'Thả file PDF vào đây',
    dropSubtitle: 'hoặc bấm để chọn file',
    noFile: 'Chưa chọn file nào',
    dpiLabel: 'DPI (0 - 300)',
    dpiHint: 'DPI thấp hơn sẽ giảm dung lượng nhiều hơn, nhưng chất lượng ảnh có thể giảm.',
    compressButton: 'Nén PDF',
    helper: 'Sau khi xử lý xong, link tải sẽ xuất hiện tại đây.',
    download: 'Tải về',
    resultSummary: 'File sau nén {size} • Tiết kiệm {percent}',
    gsMissing: 'Máy chủ chưa cài Ghostscript (gs), nên chưa thể nén PDF.',
    fileRequired: 'Bạn chưa chọn file PDF.',
    compressFailed: 'Không thể nén PDF.',
    uploadFailed: 'Upload thất bại. Kiểm tra lại dung lượng hoặc file PDF.',
    pdfOnlyError: 'Chỉ hỗ trợ file PDF.',
    expiredFile: 'File không tồn tại hoặc đã hết hạn.',
    unknownError: 'Đã có lỗi xảy ra.'
  },
  en: {
    metaTitle: 'MadPDF — Compress PDF by DPI',
    metaDescription: 'Compress PDF directly on the web with a custom DPI value and instant download.',
    languageLabel: 'Language',
    gsTitle: 'Ghostscript is missing',
    gsBody: 'The PDF compression engine uses Ghostscript. Install it on the server first to start processing.',
    errorTitle: 'Error',
    consoleKicker: 'Compression Console',
    consoleTitle: 'Upload & optimize',
    maxFile: 'Max file: 100MB',
    pdfOnly: 'PDF only',
    dropTitle: 'Drop your PDF here',
    dropSubtitle: 'or click to choose a file',
    noFile: 'No file selected',
    dpiLabel: 'DPI (0 - 300)',
    dpiHint: 'Lower DPI reduces file size more, but image quality may drop.',
    compressButton: 'Compress PDF',
    helper: 'After processing, your download link will appear here.',
    download: 'Download',
    resultSummary: 'Compressed file {size} • Saved {percent}',
    gsMissing: 'Ghostscript (gs) is not installed on the server yet, so PDF compression is unavailable.',
    fileRequired: 'Please choose a PDF file.',
    compressFailed: 'Unable to compress the PDF.',
    uploadFailed: 'Upload failed. Please check the file size and PDF format.',
    pdfOnlyError: 'Only PDF files are supported.',
    expiredFile: 'The file does not exist or has expired.',
    unknownError: 'Something went wrong.'
  },
  'zh-TW': {
    metaTitle: 'MadPDF — 依 DPI 壓縮 PDF',
    metaDescription: '在網頁上使用自訂 DPI 值壓縮 PDF，並立即下載。',
    languageLabel: '語言',
    gsTitle: '缺少 Ghostscript',
    gsBody: 'PDF 壓縮引擎使用 Ghostscript。請先在伺服器上安裝後再開始處理。',
    errorTitle: '錯誤',
    consoleKicker: '壓縮控制台',
    consoleTitle: '上傳與最佳化',
    maxFile: '檔案上限：100MB',
    pdfOnly: '僅支援 PDF',
    dropTitle: '將 PDF 拖曳到這裡',
    dropSubtitle: '或點擊選擇檔案',
    noFile: '尚未選擇檔案',
    dpiLabel: 'DPI (0 - 300)',
    dpiHint: 'DPI 越低，檔案越小，但影像品質可能會下降。',
    compressButton: '壓縮 PDF',
    helper: '處理完成後，下載連結會顯示在這裡。',
    download: '下載',
    resultSummary: '壓縮後檔案 {size} • 節省 {percent}',
    gsMissing: '伺服器尚未安裝 Ghostscript (gs)，因此目前無法壓縮 PDF。',
    fileRequired: '請選擇一個 PDF 檔案。',
    compressFailed: '無法壓縮 PDF。',
    uploadFailed: '上傳失敗。請檢查檔案大小與 PDF 格式。',
    pdfOnlyError: '僅支援 PDF 檔案。',
    expiredFile: '檔案不存在或已過期。',
    unknownError: '發生錯誤。'
  },
  'zh-CN': {
    metaTitle: 'MadPDF — 按 DPI 压缩 PDF',
    metaDescription: '使用自定义 DPI 值直接在网页上压缩 PDF，并立即下载。',
    languageLabel: '语言',
    gsTitle: '缺少 Ghostscript',
    gsBody: 'PDF 压缩引擎使用 Ghostscript。请先在服务器上安装它后再开始处理。',
    errorTitle: '错误',
    consoleKicker: '压缩控制台',
    consoleTitle: '上传并优化',
    maxFile: '最大文件：100MB',
    pdfOnly: '仅 PDF',
    dropTitle: '将 PDF 拖到这里',
    dropSubtitle: '或点击选择文件',
    noFile: '尚未选择文件',
    dpiLabel: 'DPI (0 - 300)',
    dpiHint: 'DPI 越低，文件越小，但图像质量可能会下降。',
    compressButton: '压缩 PDF',
    helper: '处理完成后，下载链接会显示在这里。',
    download: '下载',
    resultSummary: '压缩后文件 {size} • 节省 {percent}',
    gsMissing: '服务器尚未安装 Ghostscript (gs)，因此暂时无法压缩 PDF。',
    fileRequired: '请选择一个 PDF 文件。',
    compressFailed: '无法压缩 PDF。',
    uploadFailed: '上传失败。请检查文件大小和 PDF 格式。',
    pdfOnlyError: '仅支持 PDF 文件。',
    expiredFile: '文件不存在或已过期。',
    unknownError: '发生了错误。'
  },
  ko: {
    metaTitle: 'MadPDF — DPI로 PDF 압축',
    metaDescription: '사용자 지정 DPI 값으로 웹에서 바로 PDF를 압축하고 즉시 다운로드하세요.',
    languageLabel: '언어',
    gsTitle: 'Ghostscript가 없습니다',
    gsBody: 'PDF 압축 엔진은 Ghostscript를 사용합니다. 먼저 서버에 설치해야 처리를 시작할 수 있습니다.',
    errorTitle: '오류',
    consoleKicker: '압축 콘솔',
    consoleTitle: '업로드 및 최적화',
    maxFile: '최대 파일: 100MB',
    pdfOnly: 'PDF 전용',
    dropTitle: '여기에 PDF를 놓으세요',
    dropSubtitle: '또는 클릭해서 파일 선택',
    noFile: '선택된 파일이 없습니다',
    dpiLabel: 'DPI (0 - 300)',
    dpiHint: 'DPI가 낮을수록 파일 크기는 더 줄지만 이미지 품질이 떨어질 수 있습니다.',
    compressButton: 'PDF 압축',
    helper: '처리가 끝나면 다운로드 링크가 여기에 표시됩니다.',
    download: '다운로드',
    resultSummary: '압축된 파일 {size} • 절약 {percent}',
    gsMissing: '서버에 Ghostscript(gs)가 아직 설치되지 않아 PDF 압축을 사용할 수 없습니다.',
    fileRequired: 'PDF 파일을 선택해 주세요.',
    compressFailed: 'PDF를 압축할 수 없습니다.',
    uploadFailed: '업로드에 실패했습니다. 파일 크기와 PDF 형식을 확인해 주세요.',
    pdfOnlyError: 'PDF 파일만 지원됩니다.',
    expiredFile: '파일이 없거나 만료되었습니다.',
    unknownError: '오류가 발생했습니다.'
  },
  ja: {
    metaTitle: 'MadPDF — DPIでPDFを圧縮',
    metaDescription: 'カスタム DPI 値で Web 上から PDF を圧縮し、すぐにダウンロードできます。',
    languageLabel: '言語',
    gsTitle: 'Ghostscript が見つかりません',
    gsBody: 'PDF 圧縮エンジンは Ghostscript を使用します。処理を始める前にサーバーへインストールしてください。',
    errorTitle: 'エラー',
    consoleKicker: '圧縮コンソール',
    consoleTitle: 'アップロードと最適化',
    maxFile: '最大ファイル: 100MB',
    pdfOnly: 'PDFのみ',
    dropTitle: 'ここに PDF をドロップ',
    dropSubtitle: 'またはクリックしてファイルを選択',
    noFile: 'ファイルが選択されていません',
    dpiLabel: 'DPI (0 - 300)',
    dpiHint: 'DPI を下げるほどファイルサイズは小さくなりますが、画像品質は下がる場合があります。',
    compressButton: 'PDFを圧縮',
    helper: '処理が完了すると、ここにダウンロードリンクが表示されます。',
    download: 'ダウンロード',
    resultSummary: '圧縮後のファイル {size} • 削減 {percent}',
    gsMissing: 'サーバーに Ghostscript (gs) がインストールされていないため、PDF を圧縮できません。',
    fileRequired: 'PDF ファイルを選択してください。',
    compressFailed: 'PDF を圧縮できませんでした。',
    uploadFailed: 'アップロードに失敗しました。ファイルサイズと PDF 形式を確認してください。',
    pdfOnlyError: 'PDF ファイルのみ対応しています。',
    expiredFile: 'ファイルが存在しないか、有効期限が切れています。',
    unknownError: 'エラーが発生しました。'
  }
};

const tempRoot = path.join(os.tmpdir(), 'madpdf');
const uploadDir = path.join(tempRoot, 'uploads');
const outputDir = path.join(tempRoot, 'outputs');

for (const dir of [tempRoot, uploadDir, outputDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function normalizeLocale(value) {
  const input = String(value || '').trim().toLowerCase();
  if (input === 'zh-tw' || input === 'zh_tw' || input === 'zhtw') return 'zh-TW';
  if (input === 'zh-cn' || input === 'zh_cn' || input === 'zhcn') return 'zh-CN';
  if (input.startsWith('zh-hant')) return 'zh-TW';
  if (input.startsWith('zh-hans')) return 'zh-CN';
  if (input.startsWith('zh-tw')) return 'zh-TW';
  if (input.startsWith('zh-cn')) return 'zh-CN';
  if (input.startsWith('zh')) return 'zh-CN';
  if (input.startsWith('ko')) return 'ko';
  if (input.startsWith('ja')) return 'ja';
  if (input.startsWith('vi')) return 'vi';
  if (input.startsWith('en')) return 'en';
  return 'en';
}

function resolveLocale(value) {
  const normalized = normalizeLocale(value);
  return SUPPORTED_LOCALES.includes(normalized) ? normalized : 'en';
}

function serverText(locale, key) {
  const lang = resolveLocale(locale);
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
  return baseName.normalize('NFC').replace(/[\r\n"]/g, '_');
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

function renderPage({ locale = 'en', gsReady = false, error = '' }) {
  const lang = resolveLocale(locale);
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(serverText(lang, 'metaTitle'))}</title>
  <meta name="description" content="${escapeHtml(serverText(lang, 'metaDescription'))}" />
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
        <div class="brand-mark">
          <img src="/assets/logo.png" alt="MadPDF logo" class="brand-logo" />
          <p class="eyebrow">MadPDF</p>
        </div>
        <label class="lang-switcher" for="lang-select">
          <span class="sr-only">${escapeHtml(serverText(lang, 'languageLabel'))}</span>
          <select id="lang-select" aria-label="${escapeHtml(serverText(lang, 'languageLabel'))}">
            <option value="vi" ${lang === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
            <option value="en" ${lang === 'en' ? 'selected' : ''}>English</option>
            <option value="zh-TW" ${lang === 'zh-TW' ? 'selected' : ''}>繁體中文（台灣）</option>
            <option value="zh-CN" ${lang === 'zh-CN' ? 'selected' : ''}>简体中文（中国大陆）</option>
            <option value="ko" ${lang === 'ko' ? 'selected' : ''}>한국어</option>
            <option value="ja" ${lang === 'ja' ? 'selected' : ''}>日本語</option>
          </select>
        </label>
      </div>
      <div class="hero-copy">
        <h1 data-i18n="heroTitle">${escapeHtml(serverText(lang, 'heroTitle'))}</h1>
        <p class="subtitle" data-i18n="heroSubtitle">${escapeHtml(serverText(lang, 'heroSubtitle'))}</p>
      </div>
    </section>

    ${!gsReady ? `
      <section class="card notice warning" id="gs-warning">
        <div>
          <h2 data-i18n="gsTitle">${escapeHtml(serverText(lang, 'gsTitle'))}</h2>
          <p data-i18n="gsBody">${escapeHtml(serverText(lang, 'gsBody'))}</p>
        </div>
        <pre>sudo apt update && sudo apt install ghostscript</pre>
      </section>
    ` : ''}

    ${error ? `
      <section class="card notice error">
        <h2 data-i18n="errorTitle">${escapeHtml(serverText(lang, 'errorTitle'))}</h2>
        <p>${escapeHtml(error)}</p>
      </section>
    ` : ''}

    <section class="card app-shell">
      <div class="panel-head">
        <div>
          <p class="section-kicker" data-i18n="consoleKicker">${escapeHtml(serverText(lang, 'consoleKicker'))}</p>
          <h2 data-i18n="consoleTitle">${escapeHtml(serverText(lang, 'consoleTitle'))}</h2>
        </div>
        <div class="pill-row">
          <span class="pill" data-i18n="maxFile">${escapeHtml(serverText(lang, 'maxFile'))}</span>
          <span class="pill" data-i18n="pdfOnly">${escapeHtml(serverText(lang, 'pdfOnly'))}</span>
        </div>
      </div>

      <form class="form" id="compress-form" novalidate>
        <label class="dropzone" id="dropzone">
          <input type="file" name="pdf" accept="application/pdf,.pdf" required id="pdf-input" />
          <div class="dropzone-icon">PDF</div>
          <div>
            <strong data-i18n="dropTitle">${escapeHtml(serverText(lang, 'dropTitle'))}</strong>
            <span data-i18n="dropSubtitle">${escapeHtml(serverText(lang, 'dropSubtitle'))}</span>
          </div>
          <p id="selected-file" data-i18n="noFile">${escapeHtml(serverText(lang, 'noFile'))}</p>
        </label>

        <div class="control-grid single">
          <label class="field field-full">
            <div class="field-head">
              <span data-i18n="dpiLabel">${escapeHtml(serverText(lang, 'dpiLabel'))}</span>
              <small data-i18n="dpiHint">${escapeHtml(serverText(lang, 'dpiHint'))}</small>
            </div>
            <input type="number" name="dpi" min="0" max="300" step="1" value="50" required id="dpi-input" />
          </label>
        </div>

        <div class="actions">
          <button type="submit" class="button" id="submit-button" ${gsReady ? '' : 'disabled'}>
            <span data-i18n="compressButton">${escapeHtml(serverText(lang, 'compressButton'))}</span>
          </button>
          <p class="helper" data-i18n="helper">${escapeHtml(serverText(lang, 'helper'))}</p>
        </div>

        <section class="progress-card hidden" id="progress-card" aria-live="polite">
          <div class="progress-top">
            <strong id="progress-label">...</strong>
            <span id="progress-percent">0%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill"></div>
          </div>
          <p id="progress-note">...</p>
        </section>

        <section class="notice error hidden" id="error-card">
          <h2 data-i18n="errorTitle">${escapeHtml(serverText(lang, 'errorTitle'))}</h2>
          <p id="error-message"></p>
        </section>

        <section class="result hidden" id="result-card">
          <div class="result-inline">
            <div class="result-copy">
              <strong id="result-file-name">-</strong>
              <p id="result-summary">${escapeHtml(serverText(lang, 'resultSummary')).replace('{size}', '<span>-</span>').replace('{percent}', '<span>-</span>')}</p>
            </div>
            <a class="button secondary download-button" id="download-link" href="#" aria-label="${escapeHtml(serverText(lang, 'download'))}">
              <span class="button-icon" aria-hidden="true">↓</span>
              <span data-i18n="download">${escapeHtml(serverText(lang, 'download'))}</span>
            </a>
          </div>
        </section>
      </form>
    </section>

    <footer class="site-footer">
      <p>© <span id="current-year"></span> ThanhNghia</p>
      <div class="footer-links">
        <a href="https://github.com/ThanhNghiaNg" target="_blank" rel="noreferrer noopener" aria-label="GitHub">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.8.5 12.35c0 5.24 3.3 9.68 7.87 11.25.58.11.79-.26.79-.57 0-.28-.01-1.03-.02-2.03-3.2.72-3.88-1.58-3.88-1.58-.52-1.37-1.28-1.73-1.28-1.73-1.05-.74.08-.73.08-.73 1.16.08 1.77 1.23 1.77 1.23 1.04 1.84 2.72 1.31 3.38 1 .1-.77.41-1.31.74-1.61-2.55-.3-5.24-1.32-5.24-5.86 0-1.29.45-2.34 1.2-3.17-.12-.3-.52-1.52.11-3.17 0 0 .98-.32 3.2 1.21a10.72 10.72 0 0 1 5.82 0c2.22-1.53 3.2-1.21 3.2-1.21.63 1.65.23 2.87.11 3.17.75.83 1.2 1.88 1.2 3.17 0 4.55-2.7 5.55-5.28 5.85.42.37.79 1.08.79 2.19 0 1.58-.02 2.85-.02 3.24 0 .31.21.69.8.57A11.9 11.9 0 0 0 23.5 12.35C23.5 5.8 18.35.5 12 .5Z"/></svg>
        </a>
        <a href="https://www.linkedin.com/in/nghia-nguyen-thanh/" target="_blank" rel="noreferrer noopener" aria-label="LinkedIn">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5A2.49 2.49 0 0 0 2.5 6c0 1.38 1.1 2.5 2.48 2.5h.03A2.5 2.5 0 0 0 7.5 6 2.49 2.49 0 0 0 5 3.5h-.02ZM3 9.5h4v11H3v-11Zm6.5 0h3.83v1.5h.05c.53-1 1.84-2.05 3.8-2.05 4.07 0 4.82 2.75 4.82 6.32v5.23h-4v-4.64c0-1.1-.02-2.52-1.5-2.52-1.51 0-1.74 1.2-1.74 2.44v4.72h-4v-11Z"/></svg>
        </a>
      </div>
    </footer>
  </main>

  <script>window.__MADPDF__ = ${JSON.stringify({ gsReady, supportedLocales: SUPPORTED_LOCALES, locale: lang, version: APP_VERSION })};</script>
  <script src="/app.js"></script>
</body>
</html>`;
}

app.get('/', async (req, res) => {
  const gsReady = await ghostscriptAvailable();
  const locale = resolveLocale(req.query.lang || req.query.locale);
  res.send(renderPage({ gsReady, locale }));
});

app.get('/api/status', async (req, res) => {
  const gsReady = await ghostscriptAvailable();
  const locale = resolveLocale(req.query.locale || req.query.lang);
  res.json({ ok: true, gsReady, locale });
});

app.post('/api/compress', upload.single('pdf'), async (req, res) => {
  const locale = resolveLocale(req.body?.locale || req.query?.lang);
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
  const locale = resolveLocale(req.body?.locale || req.query?.lang);
  const gsReady = await ghostscriptAvailable();

  if (!gsReady) {
    if (req.file) await removeFileSafe(req.file.path);
    res.status(503).send(renderPage({ gsReady, locale, error: serverText(locale, 'gsMissing') }));
    return;
  }

  if (!req.file) {
    res.status(400).send(renderPage({ gsReady, locale, error: serverText(locale, 'fileRequired') }));
    return;
  }

  try {
    const result = await compressPdf({ file: req.file, dpi: req.body.dpi });
    res.redirect(`${result.downloadUrl}${result.downloadUrl.includes('?') ? '&' : '?'}lang=${encodeURIComponent(locale)}`);
  } catch (_error) {
    res.status(500).send(renderPage({ gsReady, locale, error: serverText(locale, 'compressFailed') }));
  }
});

app.get('/download/:fileName', async (req, res) => {
  const fileName = path.basename(req.params.fileName);
  const filePath = path.join(outputDir, fileName);
  const requestedName = sanitizeDownloadName(normalizeUploadedFileName(req.query.name || fileName));
  const locale = resolveLocale(req.query.locale || req.query.lang);

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
  const locale = resolveLocale(req.body?.locale || req.query?.locale || req.query?.lang);
  const isApi = (req.originalUrl || '').startsWith('/api/');
  const key = error instanceof multer.MulterError
    ? 'uploadFailed'
    : error.message === 'PDF_ONLY'
      ? 'pdfOnlyError'
      : 'unknownError';
  const message = serverText(locale, key);

  if (isApi) {
    res.status(400).json({ ok: false, error: message, code: 'UPLOAD_ERROR' });
    return;
  }

  ghostscriptAvailable().then((gsReady) => {
    res.status(400).send(renderPage({ gsReady, locale, error: message }));
  }).catch(() => {
    res.status(400).send(renderPage({ gsReady: false, locale, error: message }));
  });
});

app.listen(port, () => {
  console.log(`MadPDF is running at http://localhost:${port}`);
});
