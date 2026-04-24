const config = window.__MADPDF__ || { gsReady: false, supportedLocales: ['en'], locale: 'en' };

const localeLabels = {
  vi: 'Tiếng Việt',
  en: 'English',
  'zh-TW': '繁體中文（台灣）',
  'zh-CN': '简体中文（中国大陆）',
  ko: '한국어',
  ja: '日本語',
};

const defaultTranslations = {
  en: {
    metaTitle: 'MadPDF — Compress PDF by DPI',
    metaDescription: 'Compress PDF directly on the web with a custom DPI value and instant download.',
    languageLabel: 'Language',
    brand: 'MadPDF',
    heroTitle: 'Compress PDF by DPI',
    heroSubtitle: 'Upload a PDF, choose a DPI value from 0 to 300, and compress it as much as you want.',
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
    uploading: 'Uploading...',
    uploadPrepare: 'Preparing upload...',
    uploadSending: 'Uploading file to the server...',
    uploadSent: 'Sent {percent}% of the file to the server',
    completed: 'Completed',
    completedNote: 'Your PDF is ready. You can download it now.',
    failed: 'Processing failed',
    failedNote: 'The server returned an error during processing.',
    connectionFailed: 'Connection failed',
    connectionNote: 'Unable to reach the server.',
    connectionRetry: 'Unable to reach the server. Please try again.',
    uploadStart: 'Starting upload...',
    compressing: 'Compressing PDF...',
    compressingNote: 'Upload is done. The server is optimizing your PDF now...',
    download: 'Download',
    resultSummary: 'Compressed file {size} • Saved {percent}',
    gsMissing: 'Ghostscript (gs) is not installed on the server yet, so PDF compression is unavailable.',
    chooseFile: 'Please choose a PDF file.',
    invalidFile: 'Only PDF files are supported.'
  }
};

const form = document.getElementById('compress-form');
const dropzone = document.getElementById('dropzone');
const input = document.getElementById('pdf-input');
const dpiInput = document.getElementById('dpi-input');
const selectedFile = document.getElementById('selected-file');
const submitButton = document.getElementById('submit-button');
const langSelect = document.getElementById('lang-select');
const resultSummary = document.getElementById('result-summary');
const metaDescription = document.querySelector('meta[name="description"]');

const progressCard = document.getElementById('progress-card');
const progressLabel = document.getElementById('progress-label');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const progressNote = document.getElementById('progress-note');

const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');

const resultCard = document.getElementById('result-card');
const downloadLink = document.getElementById('download-link');
const resultFileName = document.getElementById('result-file-name');

let translations = { ...defaultTranslations };
let currentLocale = config.locale || 'en';
let lastSelectedFile = null;
let lastResult = null;

function normalizeLocale(locale) {
  const input = String(locale || '').trim().toLowerCase();
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

function isSupportedLocale(locale) {
  return (config.supportedLocales || []).includes(locale);
}

function getLangFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  const normalized = normalizeLocale(lang);
  return isSupportedLocale(normalized) ? normalized : null;
}

function detectInitialLocale() {
  const fromUrl = getLangFromUrl();
  if (fromUrl) return fromUrl;

  const saved = normalizeLocale(localStorage.getItem('madpdf.locale'));
  if (saved && isSupportedLocale(saved)) return saved;

  return normalizeLocale(navigator.language || 'en');
}

function t(key, vars = {}) {
  const dict = translations[currentLocale] || translations.en || defaultTranslations.en;
  let template = dict[key] || translations.en?.[key] || defaultTranslations.en[key] || key;
  for (const [name, value] of Object.entries(vars)) {
    template = template.replaceAll(`{${name}}`, value);
  }
  return template;
}

async function loadLocale(locale) {
  const normalized = normalizeLocale(locale);
  const target = isSupportedLocale(normalized) ? normalized : 'en';
  if (translations[target]) return translations[target];

  const response = await fetch(`/locales/${target}.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error(`Failed to load locale: ${target}`);
  const data = await response.json();
  translations[target] = data;
  return data;
}

function updateUrlLang(locale, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set('lang', locale);
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
}

function updateSelectedFile(file) {
  lastSelectedFile = file || null;
  if (!selectedFile) return;
  if (!file) {
    selectedFile.textContent = t('noFile');
    return;
  }
  selectedFile.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
}

function hide(el) {
  el?.classList.add('hidden');
}

function show(el) {
  el?.classList.remove('hidden');
}

function resetFeedback() {
  hide(errorCard);
  hide(resultCard);
}

function setError(message) {
  if (!errorMessage) return;
  errorMessage.textContent = message;
  show(errorCard);
}

function setProgress(value, label, note) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
  if (progressPercent) progressPercent.textContent = `${Math.round(safeValue)}%`;
  if (progressFill) progressFill.style.width = `${safeValue}%`;
  if (progressLabel && label) progressLabel.textContent = label;
  if (progressNote && note) progressNote.textContent = note;
}

function updateResultSummary() {
  if (!resultSummary || !lastResult) return;
  resultSummary.innerHTML = t('resultSummary', {
    size: `<span>${lastResult.compressedSize}</span>`,
    percent: `<span>${lastResult.savedPercent}%</span>`,
  });
}

function renderResult(result) {
  if (!result) return;
  const normalizedOriginalName = String(result.originalName || 'download.pdf').normalize('NFC');
  lastResult = { ...result, originalName: normalizedOriginalName };
  resultFileName.textContent = normalizedOriginalName;
  downloadLink.href = withLang(result.downloadUrl);
  downloadLink.download = normalizedOriginalName;
  updateResultSummary();
  show(resultCard);
}

function validateDpi() {
  const raw = Number.parseInt(dpiInput?.value || '150', 10);
  if (Number.isNaN(raw)) return 150;
  return Math.max(0, Math.min(300, raw));
}

function withLang(url) {
  const absolute = new URL(url, window.location.origin);
  absolute.searchParams.set('locale', currentLocale);
  absolute.searchParams.set('lang', currentLocale);
  return `${absolute.pathname}${absolute.search}`;
}

function applyTranslations() {
  document.documentElement.lang = currentLocale;
  document.title = t('metaTitle');
  if (metaDescription) metaDescription.setAttribute('content', t('metaDescription'));

  document.querySelectorAll('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    node.textContent = t(key);
  });

  if (langSelect) {
    langSelect.value = currentLocale;
    langSelect.setAttribute('aria-label', t('languageLabel'));
  }

  updateSelectedFile(lastSelectedFile);
  updateResultSummary();
}

async function setLocale(locale, options = {}) {
  const nextLocale = normalizeLocale(locale);
  const target = isSupportedLocale(nextLocale) ? nextLocale : 'en';
  await loadLocale(target);
  currentLocale = target;
  localStorage.setItem('madpdf.locale', currentLocale);
  if (options.updateUrl !== false) {
    updateUrlLang(currentLocale, Boolean(options.replaceUrl));
  }
  applyTranslations();
}

if (langSelect) {
  langSelect.addEventListener('change', async () => {
    await setLocale(langSelect.value);
  });
}

if (input) {
  input.addEventListener('change', () => {
    updateSelectedFile(input.files?.[0]);
    resetFeedback();
  });
}

if (dpiInput) {
  dpiInput.addEventListener('change', () => {
    dpiInput.value = String(validateDpi());
  });
}

if (dropzone && input) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.type && file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError(t('invalidFile'));
      return;
    }

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    updateSelectedFile(file);
    resetFeedback();
  });
}

if (form) {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    resetFeedback();

    if (!config.gsReady) {
      setError(t('gsMissing'));
      return;
    }

    const file = input?.files?.[0];
    if (!file) {
      setError(t('chooseFile'));
      return;
    }

    const dpi = validateDpi();
    if (dpiInput) dpiInput.value = String(dpi);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('dpi', String(dpi));
    formData.append('locale', currentLocale);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/compress');
    xhr.responseType = 'json';

    show(progressCard);
    setProgress(0, t('uploading'), t('uploadPrepare'));

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('is-loading');
    }

    xhr.upload.addEventListener('progress', (progressEvent) => {
      if (!progressEvent.lengthComputable) {
        setProgress(30, t('uploading'), t('uploadSending'));
        return;
      }

      const percent = (progressEvent.loaded / progressEvent.total) * 100;
      setProgress(percent, t('uploading'), t('uploadSent', { percent: String(Math.round(percent)) }));
    });

    xhr.addEventListener('load', () => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
      }

      if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.ok) {
        setProgress(100, t('completed'), t('completedNote'));
        renderResult(xhr.response.result);
        return;
      }

      hide(resultCard);
      const message = xhr.response?.error || t('failedNote');
      setProgress(100, t('failed'), t('failedNote'));
      setError(message);
    });

    xhr.addEventListener('error', () => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
      }
      hide(resultCard);
      setProgress(100, t('connectionFailed'), t('connectionNote'));
      setError(t('connectionRetry'));
    });

    xhr.addEventListener('loadstart', () => {
      setProgress(3, t('uploading'), t('uploadStart'));
    });

    xhr.addEventListener('loadend', () => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
      }
    });

    xhr.send(formData);

    const estimatedUploadTime = Math.max(1200, Math.min(6000, file.size / 180));
    setTimeout(() => {
      if (xhr.readyState !== XMLHttpRequest.DONE) {
        setProgress(100, t('compressing'), t('compressingNote'));
      }
    }, estimatedUploadTime);
  });
}

window.addEventListener('popstate', async () => {
  const locale = getLangFromUrl() || detectInitialLocale();
  await setLocale(locale, { updateUrl: false });
});

(async () => {
  currentLocale = detectInitialLocale();
  await setLocale(currentLocale, { replaceUrl: true });
})();
