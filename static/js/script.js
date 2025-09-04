// for upload.html
document.addEventListener('DOMContentLoaded', function() {
    const MAX_FILES = 10;
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const ALLOWED_TYPES = ['.pdf', '.docx', '.txt'];
    
    const form = document.getElementById('file-comparison-form');
    const container = document.getElementById('file-upload-container');
    const addButton = document.getElementById('add-file');
    const removeButton = document.getElementById('remove-file');
    const compareButton = document.getElementById('compare-button');
    
    // Progress bar elements
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const timeElapsed = document.getElementById('upload-time-elapsed');
    const timeRemaining = document.getElementById('upload-time-remaining');
    
    let fileUploadCount = 1;
    let uploadStartTime;
    let uploadTimer;

    // Вспомогательные функции
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 байт';
        const k = 1024;
        const sizes = ['байт', 'КБ', 'МБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTime = (seconds) => {
        if (seconds < 60) {
            return `${Math.round(seconds)} сек`;
        } else {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = Math.round(seconds % 60);
            return `${minutes} мин ${remainingSeconds} сек`;
        }
    };

    const validateFile = (file) => {
        const errors = [];
        
        if (!file) return errors;
        
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!ALLOWED_TYPES.includes(extension)) {
            errors.push(`Неверный формат файла. Разрешенные форматы: ${ALLOWED_TYPES.join(', ')}`);
        }
        
        if (file.size > MAX_FILE_SIZE) {
            errors.push(`Размер файла превышает ${formatFileSize(MAX_FILE_SIZE)}`);
        }
        
        return errors;
    };

    const createFileInput = (index) => {
        const div = document.createElement('div');
        div.classList.add('mb-4', 'file-upload');
        
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <label for="file-upload-${index}" class="form-label h5 mb-0">
                    <span class="fas fa-file-alt me-2" aria-hidden="true"></span>
                    Файл ${index}
                </label>
                <span class="badge bg-secondary" id="file-size-${index}"></span>
            </div>
            <input type="file" 
                   id="file-upload-${index}" 
                   name="files" 
                   class="form-control form-control-lg"
                   accept=".pdf,.docx,.txt"
                   aria-describedby="file-help-${index}"
                   required>
            <div class="invalid-feedback">Пожалуйста, выберите допустимый файл.</div>
            <div id="file-help-${index}" class="form-text">
            </div>
        `;
        
        return div;
    };

    // Обработчики событий
    const handleFileChange = (event) => {
        const input = event.target;
        const sizeLabel = document.getElementById(`file-size-${input.id.split('-').pop()}`);
        const file = input.files[0];
        
        if (file) {
            const errors = validateFile(file);
            
            if (errors.length > 0) {
                input.value = '';
                sizeLabel.textContent = '';
                alert(errors.join('\n'));
            } else {
                sizeLabel.textContent = formatFileSize(file.size);
            }
        } else {
            sizeLabel.textContent = '';
        }
        
        updateFormState();
    };

    const updateFormState = () => {
        const fileInputs = container.querySelectorAll('input[type="file"]');
        const hasFiles = Array.from(fileInputs).some(input => input.files.length > 0);
        
        removeButton.disabled = fileUploadCount === 1;
        addButton.disabled = fileUploadCount === MAX_FILES;
        compareButton.disabled = !hasFiles;
    };

    const updateProgressBar = (progress) => {
        progressBar.style.width = `${progress}%`;
        progressBar.textContent = `${progress}%`;
        progressBar.setAttribute('aria-valuenow', progress);
        
        // Update elapsed time
        const elapsedSeconds = (Date.now() - uploadStartTime) / 1000;
        timeElapsed.textContent = `Прошло: ${formatTime(elapsedSeconds)}`;
        
        // Calculate and update remaining time
        if (progress > 0) {
            const totalTimeEstimate = elapsedSeconds / (progress / 100);
            const remainingTimeEstimate = totalTimeEstimate - elapsedSeconds;
            timeRemaining.textContent = `Осталось: ${formatTime(remainingTimeEstimate)}`;
        }
    };

    const simulateProgress = (totalUploadSize) => {
        // Calculate estimated upload time based on file size
        // This is a rough estimate; in a real implementation you would use XHR or Fetch API
        const baseUploadTime = 20; // base time in seconds
        const sizeMultiplier = totalUploadSize / (1024 * 1024); // size in MB
        const estimatedTotalTime = baseUploadTime + (sizeMultiplier * 2); // adjust formula as needed
        
        let progress = 0;
        const updateInterval = Math.max(estimatedTotalTime * 10, 100); // updates every 100ms but scales with estimated time
        
        uploadStartTime = Date.now();
        
        uploadTimer = setInterval(() => {
            // Non-linear progress simulation to make it more realistic
            if (progress < 90) {
                const increment = Math.max(0.1, (90 - progress) / (estimatedTotalTime * 10));
                progress += increment;
                updateProgressBar(Math.min(Math.round(progress), 90));
            }
        }, updateInterval);
        
        return estimatedTotalTime * 1000; // Return estimated time in milliseconds
    };

    const resetProgress = () => {
        if (uploadTimer) {
            clearInterval(uploadTimer);
        }
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';
        progressBar.setAttribute('aria-valuenow', 0);
        timeElapsed.textContent = 'Прошло: 0 сек';
        timeRemaining.textContent = 'Осталось: расчет...';
        progressContainer.classList.add('d-none');
    };

    // Слушатели событий
    addButton.addEventListener('click', () => {
        if (fileUploadCount < MAX_FILES) {
            fileUploadCount++;
            const newInput = createFileInput(fileUploadCount);
            container.appendChild(newInput);
            
            const fileInput = newInput.querySelector('input[type="file"]');
            fileInput.addEventListener('change', handleFileChange);
            
            updateFormState();
        }
    });

    removeButton.addEventListener('click', () => {
        if (fileUploadCount > 1) {
            container.removeChild(container.lastElementChild);
            fileUploadCount--;
            updateFormState();
        }
    });

    // Валидация формы и начало загрузки
    form.addEventListener('submit', async (event) => {
        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
            form.classList.add('was-validated');
            return;
        }
        
        event.preventDefault(); // Prevent default form submission
        
        // Calculate total upload size
        const fileInputs = document.querySelectorAll('input[type="file"]');
        let totalSize = 0;
        
        fileInputs.forEach(input => {
            if (input.files.length > 0) {
                totalSize += input.files[0].size;
            }
        });
        
        // Show progress bar
        resetProgress();
        progressContainer.classList.remove('d-none');
        
        // Start simulating progress
        const estimatedTime = simulateProgress(totalSize);
        
        // Submit form data using FormData and fetch API
        const formData = new FormData(form);
        
        try {
            // After estimated time has passed, complete the upload
            setTimeout(() => {
                clearInterval(uploadTimer);
                
                // Set progress to 100%
                updateProgressBar(100);
                timeRemaining.textContent = 'Осталось: 0 сек';
                
                // Submit the form data
                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    credentials: 'same-origin'
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.text();
                })
                .then(html => {
                    // Replace the current page with the response
                    document.open();
                    document.write(html);
                    document.close();
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('Произошла ошибка при отправке файлов. Пожалуйста, попробуйте еще раз.');
                    resetProgress();
                });
            }, estimatedTime);
        } catch (error) {
            console.error('Error:', error);
            alert('Произошла ошибка при подготовке файлов. Пожалуйста, попробуйте еще раз.');
            resetProgress();
        }
        
        form.classList.add('was-validated');
    });

    // Инициализация слушателей событий для существующего поля ввода файлов
    document.querySelector('input[type="file"]').addEventListener('change', handleFileChange);
    updateFormState();
});