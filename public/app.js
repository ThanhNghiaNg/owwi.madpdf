const config = window.__MADPDF__ || { gsReady: false, supportedLocales: ['en'] };

const translations = {
  vi: {
    languageLabel: 'Ngôn ngữ',
    brand: 'MadPDF',
    heroTitle: 'Nén PDF theo DPI',
    heroSubtitle: 'Tải PDF lên, chọn DPI từ 0 đến 300 và nén theo mức bạn muốn.',
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
    uploading: 'Đang tải lên...',
    uploadPrepare: 'Đang chuẩn bị upload...',
    uploadSending: 'Đang tải file lên server...',
    uploadSent: 'Đã gửi {percent}% file lên server',
    completed: 'Hoàn tất',
    completedNote: 'PDF đã nén xong. Bạn có thể tải ngay bây giờ.',
    failed: 'Xử lý thất bại',
    failedNote: 'Server trả về lỗi trong quá trình xử lý.',
    connectionFailed: 'Lỗi kết nối',
    connectionNote: 'Không thể kết nối tới server.',
    connectionRetry: 'Không thể kết nối tới server. Vui lòng thử lại.',
    uploadStart: 'Bắt đầu gửi file...',
    compressing: 'Đang nén PDF...',
    compressingNote: 'Upload đã xong, server đang tối ưu file PDF...',
    download: 'Tải về',
    resultSummary: 'File sau nén {size} • Tiết kiệm {percent}',
    gsMissing: 'Máy chủ chưa cài Ghostscript (gs), nên chưa thể nén PDF.',
    chooseFile: 'Bạn chưa chọn file PDF.',
    invalidFile: 'Chỉ hỗ trợ file PDF.',
  },
  en: {
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
    invalidFile: 'Only PDF files are supported.',
  },
  zh: {
    languageLabel: '语言',
    brand: 'MadPDF',
    heroTitle: '按 DPI 压缩 PDF',
    heroSubtitle: '上传 PDF，选择 0 到 300 的 DPI 值，并按你需要的程度进行压缩。',
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
    uploading: '正在上传...',
    uploadPrepare: '正在准备上传...',
    uploadSending: '正在将文件上传到服务器...',
    uploadSent: '已上传 {percent}% 到服务器',
    completed: '已完成',
    completedNote: 'PDF 已压缩完成，现在可以下载。',
    failed: '处理失败',
    failedNote: '服务器在处理过程中返回了错误。',
    connectionFailed: '连接失败',
    connectionNote: '无法连接到服务器。',
    connectionRetry: '无法连接到服务器，请重试。',
    uploadStart: '开始上传...',
    compressing: '正在压缩 PDF...',
    compressingNote: '上传已完成，服务器正在优化 PDF...',
    download: '下载',
    resultSummary: '压缩后文件 {size} • 节省 {percent}',
    gsMissing: '服务器尚未安装 Ghostscript (gs)，因此暂时无法压缩 PDF。',
    chooseFile: '请选择一个 PDF 文件。',
    invalidFile: '仅支持 PDF 文件。',
  },
  ko: {
    languageLabel: '언어',
    brand: 'MadPDF',
    heroTitle: 'DPI로 PDF 압축',
    heroSubtitle: 'PDF를 업로드하고 0에서 300 사이의 DPI를 선택한 뒤 원하는 만큼 압축하세요.',
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
    uploading: '업로드 중...',
    uploadPrepare: '업로드 준비 중...',
    uploadSending: '서버로 파일을 업로드하는 중...',
    uploadSent: '파일의 {percent}%를 서버로 전송했습니다',
    completed: '완료됨',
    completedNote: 'PDF 압축이 완료되었습니다. 지금 다운로드할 수 있습니다.',
    failed: '처리 실패',
    failedNote: '처리 중 서버에서 오류가 반환되었습니다.',
    connectionFailed: '연결 실패',
    connectionNote: '서버에 연결할 수 없습니다.',
    connectionRetry: '서버에 연결할 수 없습니다. 다시 시도해 주세요.',
    uploadStart: '업로드 시작...',
    compressing: 'PDF 압축 중...',
    compressingNote: '업로드가 완료되었습니다. 서버가 PDF를 최적화하는 중입니다...',
    download: '다운로드',
    resultSummary: '압축된 파일 {size} • 절약 {percent}',
    gsMissing: '서버에 Ghostscript(gs)가 아직 설치되지 않아 PDF 압축을 사용할 수 없습니다.',
    chooseFile: 'PDF 파일을 선택해 주세요.',
    invalidFile: 'PDF 파일만 지원됩니다.',
  },
  ja: {
    languageLabel: '言語',
    brand: 'MadPDF',
    heroTitle: 'DPIでPDFを圧縮',
    heroSubtitle: 'PDF をアップロードし、0 から 300 の DPI を選んで、希望に合わせて圧縮できます。',
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
    uploading: 'アップロード中...',
    uploadPrepare: 'アップロードを準備中...',
    uploadSending: 'サーバーへファイルをアップロード中...',
    uploadSent: 'ファイルの {percent}% をサーバーへ送信しました',
    completed: '完了',
    completedNote: 'PDF の圧縮が完了しました。今すぐダウンロードできます。',
    failed: '処理に失敗しました',
    failedNote: '処理中にサーバーでエラーが発生しました。',
    connectionFailed: '接続に失敗しました',
    connectionNote: 'サーバーに接続できません。',
    connectionRetry: 'サーバーに接続できません。もう一度お試しください。',
    uploadStart: 'アップロード開始...',
    compressing: 'PDF を圧縮中...',
    compressingNote: 'アップロードは完了しました。サーバーが PDF を最適化しています...',
    download: 'ダウンロード',
    resultSummary: '圧縮後のファイル {size} • 削減 {percent}',
    gsMissing: 'サーバーに Ghostscript (gs) がインストールされていないため、PDF を圧縮できません。',
    chooseFile: 'PDF ファイルを選択してください。',
    invalidFile: 'PDF ファイルのみ対応しています。',
  },
};

const localeLabels = {
  vi: 'Tiếng Việt',
  en: 'English',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
};

const form = document.getElementById('compress-form');
const dropzone = document.getElementById('dropzone');
const input = document.getElementById('pdf-input');
const dpiInput = document.getElementById('dpi-input');
const selectedFile = document.getElementById('selected-file');
const submitButton = document.getElementById('submit-button');
const langSelect = document.getElementById('lang-select');
const resultSummary = document.getElementById('result-summary');

const progressCard = document.getElementById('progress-card');
const progressLabel = document.getElementById('progress-label');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const progressNote = document.getElementById('progress-note');

const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');

const resultCard = document.getElementById('result-card');
const downloadLink = document.getElementById('download-link');
const statCompressedSize = document.getElementById('stat-compressed-size');
const statSavedPercent = document.getElementById('stat-saved-percent');
const resultFileName = document.getElementById('result-file-name');

let currentLocale = detectInitialLocale();
let lastSelectedFile = null;

function detectInitialLocale() {
  const saved = localStorage.getItem('madpdf.locale');
  if (saved && translations[saved]) return saved;
  const browserLang = (navigator.language || 'en').toLowerCase();
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('zh')) return 'zh';
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('ja')) return 'ja';
  return 'en';
}

function t(key, vars = {}) {
  const dict = translations[currentLocale] || translations.en;
  let template = dict[key] || translations.en[key] || key;
  for (const [name, value] of Object.entries(vars)) {
    template = template.replaceAll(`{${name}}`, value);
  }
  return template;
}

function applyTranslations() {
  document.documentElement.lang = currentLocale;
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
  if (!resultSummary || !statCompressedSize || !statSavedPercent) return;
  resultSummary.innerHTML = `${t('resultSummary', {
    size: `<span id="stat-compressed-size">${statCompressedSize.textContent || '-'}</span>`,
    percent: `<span id="stat-saved-percent">${statSavedPercent.textContent || '-'}</span>`,
  })}`;
}

function renderResult(result) {
  if (!result) return;
  statCompressedSize.textContent = result.compressedSize;
  statSavedPercent.textContent = `${result.savedPercent}%`;
  resultFileName.textContent = result.originalName;
  downloadLink.href = `${result.downloadUrl}${result.downloadUrl.includes('?') ? '&' : '?'}locale=${encodeURIComponent(currentLocale)}`;
  resultSummary.innerHTML = t('resultSummary', {
    size: `<span id="stat-compressed-size">${result.compressedSize}</span>`,
    percent: `<span id="stat-saved-percent">${result.savedPercent}%</span>`,
  });
  show(resultCard);
}

function validateDpi() {
  const raw = Number.parseInt(dpiInput?.value || '150', 10);
  if (Number.isNaN(raw)) return 150;
  return Math.max(0, Math.min(300, raw));
}

if (langSelect) {
  langSelect.addEventListener('change', () => {
    currentLocale = translations[langSelect.value] ? langSelect.value : 'en';
    localStorage.setItem('madpdf.locale', currentLocale);
    applyTranslations();
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

applyTranslations();
