const config = window.__MADPDF__ || { gsReady: false };

const form = document.getElementById('compress-form');
const dropzone = document.getElementById('dropzone');
const input = document.getElementById('pdf-input');
const dpiInput = document.getElementById('dpi-input');
const selectedFile = document.getElementById('selected-file');
const submitButton = document.getElementById('submit-button');

const progressCard = document.getElementById('progress-card');
const progressLabel = document.getElementById('progress-label');
const progressPercent = document.getElementById('progress-percent');
const progressFill = document.getElementById('progress-fill');
const progressNote = document.getElementById('progress-note');

const errorCard = document.getElementById('error-card');
const errorMessage = document.getElementById('error-message');

const resultCard = document.getElementById('result-card');
const downloadLink = document.getElementById('download-link');
const statOriginalSize = document.getElementById('stat-original-size');
const statCompressedSize = document.getElementById('stat-compressed-size');
const statSavedPercent = document.getElementById('stat-saved-percent');
const statDpi = document.getElementById('stat-dpi');
const resultFileName = document.getElementById('result-file-name');
const statSavedSize = document.getElementById('stat-saved-size');

function updateSelectedFile(file) {
  if (!selectedFile) return;
  if (!file) {
    selectedFile.textContent = 'Chưa chọn file nào';
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

function renderResult(result) {
  if (!result) return;
  statOriginalSize.textContent = result.originalSize;
  statCompressedSize.textContent = result.compressedSize;
  statSavedPercent.textContent = `${result.savedPercent}%`;
  statDpi.textContent = String(result.dpi);
  resultFileName.textContent = result.originalName;
  statSavedSize.textContent = result.savedSize;
  downloadLink.href = result.downloadUrl;
  show(resultCard);
}

function validateDpi() {
  const raw = Number.parseInt(dpiInput?.value || '150', 10);
  if (Number.isNaN(raw)) return 150;
  return Math.max(0, Math.min(300, raw));
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
      setError('Máy chủ chưa cài Ghostscript (gs), nên chưa thể nén PDF.');
      return;
    }

    const file = input?.files?.[0];
    if (!file) {
      setError('Bạn chưa chọn file PDF.');
      return;
    }

    const dpi = validateDpi();
    if (dpiInput) dpiInput.value = String(dpi);

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('dpi', String(dpi));

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/compress');
    xhr.responseType = 'json';

    show(progressCard);
    setProgress(0, 'Đang upload...', 'Chuẩn bị gửi file lên server...');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('is-loading');
    }

    xhr.upload.addEventListener('progress', (progressEvent) => {
      if (!progressEvent.lengthComputable) {
        setProgress(30, 'Đang upload...', 'Đang tải file lên server...');
        return;
      }

      const percent = (progressEvent.loaded / progressEvent.total) * 100;
      setProgress(percent, 'Đang upload...', `Đã gửi ${Math.round(percent)}% file lên server`);
    });

    xhr.addEventListener('load', () => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
      }

      if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.ok) {
        setProgress(100, 'Hoàn tất', 'PDF đã nén xong. Bạn có thể tải file ngay bây giờ.');
        renderResult(xhr.response.result);
        return;
      }

      hide(resultCard);
      const message = xhr.response?.error || 'Không thể xử lý PDF. Vui lòng thử lại.';
      setProgress(100, 'Xử lý thất bại', 'Server trả về lỗi trong quá trình xử lý.');
      setError(message);
    });

    xhr.addEventListener('error', () => {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('is-loading');
      }
      hide(resultCard);
      setProgress(100, 'Kết nối lỗi', 'Không thể kết nối tới server.');
      setError('Không thể kết nối tới server. Vui lòng thử lại.');
    });

    xhr.addEventListener('loadstart', () => {
      setProgress(3, 'Đang upload...', 'Bắt đầu gửi file...');
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
        setProgress(100, 'Đang nén PDF...', 'Upload đã xong, server đang tối ưu file PDF...');
      }
    }, estimatedUploadTime);
  });
}
