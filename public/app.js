const dropzone = document.getElementById('dropzone');
const input = document.getElementById('pdf-input');
const selectedFile = document.getElementById('selected-file');

function updateSelectedFile(file) {
  if (!file) {
    selectedFile.textContent = 'Chưa chọn file nào';
    return;
  }
  selectedFile.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
}

if (input) {
  input.addEventListener('change', () => {
    updateSelectedFile(input.files?.[0]);
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
  });
}
