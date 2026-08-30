document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  menuToggle.addEventListener('click', function(e) {
    e.stopPropagation();
    navLinks.classList.toggle('active');
    const icon = this.querySelector('i');
    icon.className = navLinks.classList.contains('active') ? 'fas fa-times' : 'fas fa-bars';
  });

  document.addEventListener('click', function(e) {
    if (!e.target.closest('.navbar') && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      menuToggle.querySelector('i').className = 'fas fa-bars';
    }
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function() {
      if (window.innerWidth < 1024) {
        navLinks.classList.remove('active');
        menuToggle.querySelector('i').className = 'fas fa-bars';
      }
    });
  });

  window.addEventListener('resize', function() {
    if (window.innerWidth >= 1024 && navLinks.classList.contains('active')) {
      navLinks.classList.remove('active');
      menuToggle.querySelector('i').className = 'fas fa-bars';
    }
  });

  // --- File upload handlers ---
  setupFileUpload('apkFile', 'apkFileName', null, null);
  setupIconUpload();
  setupScreenshotUpload();
  setupFileUpload('thumbnailFile', 'thumbnailFileName', 'thumbnailPreview', null);
  
  // --- Word counters ---
  setupWordCounter('shortDesc', 'shortDescCount', 100);
  setupWordCounter('longDesc', 'longDescCount', 200);
});

// --- Generic file upload ---
function setupFileUpload(inputId, fileNameId, previewContainerId, validExtensions) {
  const input = document.getElementById(inputId);
  const fileNameEl = document.getElementById(fileNameId);

  input.addEventListener('change', function(e) {
    if (this.files.length > 0) {
      const file = this.files[0];
      fileNameEl.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
      
      if (previewContainerId) {
        const container = document.getElementById(previewContainerId);
        container.innerHTML = '';
        const preview = createImagePreview(file);
        container.appendChild(preview);
      }
    } else {
      fileNameEl.textContent = '';
      if (previewContainerId) {
        document.getElementById(previewContainerId).innerHTML = '';
      }
    }
  });

  // Drag and drop visual feedback
  const uploadZone = input.closest('.file-upload');
  uploadZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    this.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', function(e) {
    this.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', function(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      input.files = files;
      input.dispatchEvent(new Event('change'));
    }
  });
}

// --- Icon upload with 1:1 validation ---
function setupIconUpload() {
  const input = document.getElementById('iconFile');
  const fileNameEl = document.getElementById('iconFileName');
  const previewContainer = document.getElementById('iconPreviewContainer');
  const preview = document.getElementById('iconPreview');
  const dimensionsEl = document.getElementById('iconDimensions');
  const formatEl = document.getElementById('iconFormat');
  const statusEl = document.getElementById('iconStatus');

  input.addEventListener('change', function(e) {
    if (this.files.length > 0) {
      const file = this.files[0];
      fileNameEl.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
      previewContainer.style.display = 'flex';
      
      // Load image to check dimensions
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const width = img.width;
          const height = img.height;
          dimensionsEl.textContent = width + ' × ' + height + ' px';
          formatEl.textContent = file.type.split('/')[1].toUpperCase();
          
          // Check 1:1 aspect ratio and size
          if (width === height && width <= 1024 && height <= 1024) {
            statusEl.textContent = '✓ Valid 1:1 (under 1024px)';
            statusEl.style.color = '#059669';
            preview.innerHTML = `<img src="${e.target.result}" alt="App icon" />`;
            input.setCustomValidity('');
          } else {
            let error = '✗ Invalid: ';
            if (width !== height) error += 'Not 1:1 aspect ratio. ';
            if (width > 1024 || height > 1024) error += 'Exceeds 1024px. ';
            statusEl.textContent = error;
            statusEl.style.color = '#dc2626';
            preview.innerHTML = `<div class="placeholder"><i class="fas fa-exclamation-circle" style="color:#dc2626;"></i></div>`;
            input.setCustomValidity('Icon must be 1:1 aspect ratio and under 1024px');
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      fileNameEl.textContent = '';
      previewContainer.style.display = 'none';
      preview.innerHTML = `<div class="placeholder"><i class="fas fa-image"></i></div>`;
      input.setCustomValidity('');
    }
  });
}

// --- Screenshot upload (3-5) ---
function setupScreenshotUpload() {
  const input = document.getElementById('screenshotFiles');
  const countEl = document.getElementById('screenshotCount');
  const previewContainer = document.getElementById('screenshotPreview');

  input.addEventListener('change', function(e) {
    const files = this.files;
    const count = files.length;
    countEl.textContent = count + ' / 5 selected';
    
    previewContainer.innerHTML = '';
    
    if (count < 3 || count > 5) {
      countEl.style.color = '#dc2626';
      input.setCustomValidity('Please select between 3 and 5 screenshots');
    } else {
      countEl.style.color = '#059669';
      input.setCustomValidity('');
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const file = files[i];
        const preview = createImagePreview(file);
        previewContainer.appendChild(preview);
      }
    }
  });
}

// --- Helper: create image preview ---
function createImagePreview(file) {
  const div = document.createElement('div');
  div.className = 'preview-item';
  
  const img = document.createElement('img');
  const reader = new FileReader();
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-btn';
  removeBtn.innerHTML = '×';
  removeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    // Remove this preview (simplified: clear all and re-add remaining)
    // For simplicity, we'll just clear and let user re-select
    div.remove();
    // Update file input (this is complex, so we'll just show a message)
    alert('To remove a file, please re-select your screenshots.');
  });
  
  div.appendChild(img);
  div.appendChild(removeBtn);
  return div;
}

// --- Word counter ---
function setupWordCounter(textareaId, counterId, maxWords) {
  const textarea = document.getElementById(textareaId);
  const counter = document.getElementById(counterId);

  textarea.addEventListener('input', function() {
    const text = this.value.trim();
    const words = text.length === 0 ? 0 : text.split(/\s+/).length;
    counter.textContent = words + ' / ' + maxWords + ' words';
    
    if (words > maxWords) {
      counter.classList.add('warning');
    } else {
      counter.classList.remove('warning');
    }
    
    if (textareaId === 'shortDesc' && words > 100) {
      textarea.setCustomValidity('Short description must be under 100 words');
    } else if (textareaId === 'longDesc' && words < 200 && text.length > 0) {
      textarea.setCustomValidity('Long description must be over 200 words');
    } else {
      textarea.setCustomValidity('');
    }
  });
}

// --- Helper: format file size ---
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// --- Form submission ---
function handleSubmit(e) {
  e.preventDefault();
  
  // Validate all fields
  const form = document.getElementById('uploadForm');
  
  // Check icon validation
  const iconInput = document.getElementById('iconFile');
  if (iconInput.files.length > 0 && iconInput.validity.customError) {
    alert('Please fix the app icon: ' + iconInput.validationMessage);
    return;
  }
  
  // Check screenshot count
  const screenshotInput = document.getElementById('screenshotFiles');
  if (screenshotInput.files.length < 3 || screenshotInput.files.length > 5) {
    alert('Please select between 3 and 5 screenshots.');
    return;
  }
  
  // Check word counts
  const shortDesc = document.getElementById('shortDesc');
  const longDesc = document.getElementById('longDesc');
  const shortWords = shortDesc.value.trim().split(/\s+/).length;
  const longWords = longDesc.value.trim().split(/\s+/).length;
  
  if (shortWords > 100) {
    alert('Short description must be under 100 words. Currently: ' + shortWords + ' words.');
    return;
  }
  
  if (longWords < 200) {
    alert('Long description must be over 200 words. Currently: ' + longWords + ' words.');
    return;
  }
  
  // If all valid, show success and redirect
  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
  
  setTimeout(function() {
    alert('✅ App published successfully!');
    window.location.href = 'dashboard.html';
  }, 1500);
}
