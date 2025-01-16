document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '/login.html';
    }

    // Fetch the last submission's review status (globally)
    const formName = document.getElementById('formName').value;
    const lastSubmission = await fetchLastSubmission(formName);
    console.log('Last submission:', lastSubmission);

    if (lastSubmission && lastSubmission.review_status === 'review') {
        lockForm(lastSubmission);
    } else {
        initializeForm();
    }
});

// Fetch the last submission for the current form (globally)
async function fetchLastSubmission(formName) {
    try {
        const response = await fetch(`/api/last-submission/${formName}`, {
            headers: { 'User-ID': localStorage.getItem('userId') }
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching last submission:', error);
        return null;
    }
}

// Lock the form if the last submission is in review state
function lockForm(lastSubmission) {
    const form = document.querySelector('form');
    const submitButton = form.querySelector('button[type="submit"]');
    const fileInput = document.getElementById('policy_document');
    const filePreview = document.getElementById('file-preview');
    const uploadLabel = document.querySelector('.file-upload label'); // Target the label element
    const progressBarContainer = document.querySelector('.progress-bar-container'); // Target the progress bar container

    // Hide submit and file upload buttons
    if (submitButton) {
        console.log('Hiding submit button');
        submitButton.style.display = 'none';
    }
    if (fileInput) {
        console.log('Hiding file input');
        fileInput.style.display = 'none';
    }
    if (uploadLabel) {
        console.log('Hiding upload label (blue button)');
        uploadLabel.style.display = 'none'; // Hide the label (blue button)
    }
    if (progressBarContainer) {
        console.log('Hiding progress bar container');
        progressBarContainer.style.display = 'none'; // Hide the progress bar
    }

    // Populate form fields with last submission data
    populateForm(lastSubmission.id);

    // Disable all form fields
    const formFields = form.querySelectorAll('input, textarea, select');
    formFields.forEach(field => {
        field.disabled = true;
    });

    // Show a message indicating the form is locked
    const messageElement = document.getElementById('message');
    if (messageElement) {
        console.log('Showing locked form message');
        messageElement.textContent = 'This form is locked because the last submission is still under review.';
        messageElement.style.display = 'block';
        messageElement.className = 'message info';
        messageElement.style.animation = 'none'; // Remove any animations
    }

    // Ensure the file preview is visible but non-interactive
    if (filePreview) {
        console.log('Making file preview non-interactive');
        filePreview.style.display = 'flex';
        filePreview.style.pointerEvents = 'none';
        filePreview.style.opacity = '0.7';
    }
}

// Initialize the form for new submissions
function initializeForm() {
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

                    // Lock the form after successful submission
                    const lastSubmission = await fetchLastSubmission(document.getElementById('formName').value);
                    if (lastSubmission) {
                        lockForm(lastSubmission);
                    }

                    // Reset form after submission
                    form.reset();
                    if (fileNameSpan) fileNameSpan.textContent = 'No file selected';
                    if (filePreview) filePreview.style.display = 'none';
                    if (uploadLabel) uploadLabel.style.display = 'none'; // Hide the label (blue button)
                    if (progressBarContainer) progressBarContainer.style.display = 'none'; // Hide the progress bar
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
}

// Common function to fetch user submissions
async function fetchUserSubmissions() {
    const formName = document.getElementById('formName').value;
    const response = await fetch(`/api/user-submissions?formName=${formName}`, {
        headers: { 'User-ID': localStorage.getItem('userId') }
    });
    return await response.json();
}

// Common function to populate form with submission data
async function populateForm(submissionId) {
    const formName = document.getElementById('formName').value;
    const response = await fetch(`/api/submission/${formName}/${submissionId}`, {
        headers: { 'User-ID': localStorage.getItem('userId') }
    });
    const submission = await response.json();

    // Populate form fields
    document.getElementById('submissionId').value = submission.id;
    for (const key in submission) {
        if (key !== 'id' && key !== 'file_name' && key !== 'submission_time') {
            const field = document.getElementById(key);
            if (field) {
                if (key === 'review_status') {
                    field.value = submission[key] || 'review'; // Default to 'review'
                } else {
                    field.value = submission[key];
                }
            }
        }
    }

    // Handle file preview
    const fileIcon = document.getElementById('file-icon');
    const fileNameSpan = document.getElementById('file-name');
    const filePreview = document.getElementById('file-preview');
    const uploadLabel = document.getElementById('upload-label');

    if (submission.file_name) {
        const fileExtension = submission.file_name.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') {
            fileIcon.src = '../images/pdf-img.png'; // Path to PDF icon
        } else if (fileExtension === 'doc' || fileExtension === 'docx') {
            fileIcon.src = '../images/word-img.png'; // Path to Word icon
        }

        fileNameSpan.textContent = submission.file_name;
        filePreview.style.display = 'flex';
        uploadLabel.textContent = 'Change File';
    } else {
        fileNameSpan.textContent = 'No file currently uploaded';
        filePreview.style.display = 'none';
        uploadLabel.textContent = 'Upload Policy Document (PDF or Word)';
    }
}

// Fetch roles from the server
async function fetchRoles() {
    try {
        const response = await fetch('/api/roles', {
            headers: { 'User-ID': localStorage.getItem('userId') }
        });
        const roles = await response.json();
        return roles;
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
}

// Populate dropdown with roles
function populateDropdown(dropdown, roles) {
    dropdown.innerHTML = '<option value="">Select a role</option>';
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.role_name;
        option.textContent = role.role_name;
        dropdown.appendChild(option);
    });
}