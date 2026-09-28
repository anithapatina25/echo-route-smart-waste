// imagePicker.js - Photo upload component with file input, drag-and-drop, and 1-click sample presets
export function createImagePicker({ containerId, label, initialUrl = null, onChange, sampleType = 'waste' }) {
  const container = document.getElementById(containerId);
  if (!container) return;

  let currentUrl = initialUrl;

  const samplePresets = sampleType === 'proof' ? [
    {
      title: 'Truck Loaded Proof',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23dcfce7"/><circle cx="200" cy="120" r="50" fill="%2316a34a"/><text x="200" y="130" font-size="36" text-anchor="middle" fill="white">✓</text><text x="200" y="210" font-size="18" font-family="sans-serif" font-weight="bold" fill="%23166534" text-anchor="middle">Driver Completion Proof</text><text x="200" y="235" font-size="13" font-family="sans-serif" fill="%2315803d" text-anchor="middle">Waste loaded into Panchayat Vehicle DL-04-E-1024</text></svg>'
    },
    {
      title: 'Cleaned Doorstep Proof',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23ecfdf5"/><rect x="50" y="50" width="300" height="200" fill="%23a7f3d0" rx="10"/><text x="200" y="140" font-size="18" font-family="sans-serif" font-weight="bold" fill="%23065f46" text-anchor="middle">Doorstep Site Cleaned</text><text x="200" y="170" font-size="13" font-family="sans-serif" fill="%23047857" text-anchor="middle">Zero residue remaining at pickup spot</text></svg>'
    }
  ] : [
    {
      title: 'Segregated Plastic & Bottles',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><rect x="80" y="60" width="240" height="180" fill="%23cbd5e1" rx="8"/><text x="200" y="140" font-size="18" font-family="sans-serif" font-weight="bold" fill="%23334155" text-anchor="middle">Segregated Plastic Waste</text><text x="200" y="165" font-size="13" font-family="sans-serif" fill="%23475569" text-anchor="middle">Bottles, wrappers &amp; containers (3 Bags)</text></svg>'
    },
    {
      title: 'Domestic Dry & Wet Waste',
      data: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23fef3c7"/><rect x="80" y="60" width="240" height="180" fill="%23fde68a" rx="8"/><text x="200" y="140" font-size="18" font-family="sans-serif" font-weight="bold" fill="%2392400e" text-anchor="middle">Household Waste Bags</text><text x="200" y="165" font-size="13" font-family="sans-serif" fill="%23b45309" text-anchor="middle">Tied sanitary and dry recyclable bags</text></svg>'
    }
  ];

  function render() {
    container.innerHTML = `
      <label class="form-label">${label}</label>
      <div class="photo-uploader" id="${containerId}-dropzone">
        <input type="file" id="${containerId}-input" accept="image/*" style="display: none;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
        <div style="font-weight: 600; color: #0f172a; margin-bottom: 0.25rem;">
          Click to browse or drag & drop photo here
        </div>
        <div style="font-size: 0.8rem; color: #64748b;">
          Supports JPG, PNG, WebP (Max 10MB)
        </div>
      </div>

      <!-- Live Preview -->
      <div id="${containerId}-preview" style="text-align: center; margin-top: 0.75rem; display: ${currentUrl ? 'block' : 'none'};">
        <div class="photo-preview-box">
          <img src="${currentUrl || ''}" class="photo-preview-img" alt="Upload Preview">
          <button type="button" class="btn btn-danger btn-sm" id="${containerId}-clear" style="position: absolute; top: 8px; right: 8px;">
            Remove
          </button>
        </div>
      </div>

      <!-- Quick Preset Buttons for Prototype Testing -->
      <div style="margin-top: 0.75rem;">
        <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 0.35rem; font-weight: 600; text-transform: uppercase;">
          Quick Demo Presets (1-Click Test):
        </div>
        <div class="photo-quick-picks">
          ${samplePresets.map((p, idx) => `
            <button type="button" class="btn btn-outline btn-sm preset-btn" data-idx="${idx}">
              ✨ ${p.title}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const dropzone = container.querySelector(`#${containerId}-dropzone`);
    const fileInput = container.querySelector(`#${containerId}-input`);
    const clearBtn = container.querySelector(`#${containerId}-clear`);

    dropzone.onclick = () => fileInput.click();

    dropzone.ondragover = (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    };

    dropzone.ondragleave = () => dropzone.classList.remove('dragover');

    dropzone.ondrop = (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    };

    fileInput.onchange = (e) => {
      if (e.target.files && e.target.files[0]) {
        handleFile(e.target.files[0]);
      }
    };

    if (clearBtn) {
      clearBtn.onclick = () => {
        currentUrl = null;
        render();
        if (onChange) onChange(null);
      };
    }

    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        currentUrl = samplePresets[idx].data;
        render();
        if (onChange) onChange(currentUrl);
      };
    });
  }

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      currentUrl = e.target.result;
      render();
      if (onChange) onChange(currentUrl);
    };
    reader.readAsDataURL(file);
  }

  render();

  return {
    getValue: () => currentUrl,
    setValue: (url) => {
      currentUrl = url;
      render();
    }
  };
}
