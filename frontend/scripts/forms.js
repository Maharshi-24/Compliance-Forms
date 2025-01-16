document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '/login.html';
    }

    // Common file upload logic
    const fileInput = document.getElementById('policy_document');
    const filePreview = document.getElementById('file-preview');
    const fileIcon = document.getElementById('file-icon');
    const fileNameSpan = document.getElementById('file-name');
    const uploadLabel = document.getElementById('upload-label');

    // Create a single progress bar container
    const progressBarContainer = document.createElement('div');
    progressBarContainer.className = 'progress-bar-container';
    const progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    const progress = document.createElement('div');
    progress.className = 'progress';
    progressBar.appendChild(progress);
    progressBarContainer.appendChild(progressBar);

    if (fileInput && filePreview && fileIcon && fileNameSpan && uploadLabel) {
        // Insert the progress bar container after the file preview
        filePreview.parentNode.insertBefore(progressBarContainer, filePreview.nextSibling);

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                const fileName = file.name;
                const fileExtension = fileName.split('.').pop().toLowerCase();

                // Set the file icon based on the file type
                if (fileExtension === 'pdf') {
                    fileIcon.src = '../images/pdf-img.png'; // Path to PDF icon
                } else if (fileExtension === 'doc' || fileExtension === 'docx') {
                    fileIcon.src = '../images/word-img.png'; // Path to Word icon
                }

                fileNameSpan.textContent = fileName;
                filePreview.style.display = 'flex';
                uploadLabel.textContent = 'Change File';

                // Reset progress bar
                progress.style.width = '0%';

                // Simulate file upload progress
                let width = 0;
                const interval = setInterval(() => {
                    if (width >= 100) {
                        clearInterval(interval);
                    } else {
                        width += 10;
                        progress.style.width = `${width}%`;
                    }
                }, 100);
            } else {
                fileNameSpan.textContent = 'No file selected';
                filePreview.style.display = 'none';
                uploadLabel.textContent = 'Upload Policy Document (PDF or Word)';
                progress.style.width = '0%'; // Reset progress bar
            }
        });
    }

    // Common form submission logic
    const form = document.querySelector('form');
    const messageElement = document.getElementById('message');

    if (form && messageElement) {
        // Form Submission Logic
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.classList.add('loading');
            submitButton.disabled = true;

            // Show a loading animation for 2 seconds before submitting
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const formData = new FormData(e.target);
            const userId = localStorage.getItem('userId');

            try {
                const response = await fetch('/submit-form', {
                    method: 'POST',
                    headers: {
                        'User-ID': userId
                    },
                    body: formData,
                });
                const result = await response.json();
                if (result.success) {
                    // Show success animation
                    messageElement.textContent = 'Form submitted successfully!';
                    messageElement.style.display = 'block';
                    messageElement.className = 'message success';
                    messageElement.style.animation = 'bounceIn 0.5s ease-out';

                    // Reset form after submission
                    form.reset();
                    if (fileNameSpan) fileNameSpan.textContent = 'No file selected';
                    if (filePreview) filePreview.style.display = 'none';
                    if (uploadLabel) uploadLabel.textContent = 'Upload Policy Document (PDF or Word)';
                    progress.style.width = '0%'; // Reset progress bar

                    // Hide the message after 3 seconds
                    setTimeout(() => {
                        messageElement.style.animation = 'fadeOut 0.5s ease-out';
                        setTimeout(() => {
                            messageElement.style.display = 'none';
                        }, 500);
                    }, 3000);
                } else {
                    throw new Error(result.error || 'Unknown error');
                }
            } catch (error) {
                console.error('Error:', error);
                messageElement.textContent = `Error: ${error.message}`;
                messageElement.style.display = 'block';
                messageElement.className = 'message error';
                messageElement.style.animation = 'bounceIn 0.5s ease-out';

                // Hide the error message after 3 seconds
                setTimeout(() => {
                    messageElement.style.animation = 'fadeOut 0.5s ease-out';
                    setTimeout(() => {
                        messageElement.style.display = 'none';
                    }, 500);
                }, 3000);
            } finally {
                submitButton.classList.remove('loading');
                submitButton.disabled = false;
            }
        });
    }
});