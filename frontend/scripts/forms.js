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

    // Fetch and populate roles if the form has a roles dropdown
    const roleSelect = document.getElementById('role'); // For form2.html
    const positionSelect = document.getElementById('position'); // For form3.html

    if (roleSelect || positionSelect) {
        fetchRoles().then(roles => {
            if (roleSelect) {
                populateDropdown(roleSelect, roles);
            }
            if (positionSelect) {
                populateDropdown(positionSelect, roles);
            }
        });
    }

    // Common form submission logic
    const form = document.querySelector('form');
    const editButton = document.getElementById('editButton');
    const messageElement = document.getElementById('message');

    if (form && editButton && messageElement) {
        // Edit Button Logic
        editButton.addEventListener('click', async () => {
            const submissions = await fetchUserSubmissions();
            if (submissions.length > 0) {
                const selectedSubmission = await selectSubmission(submissions);
                if (selectedSubmission) {
                    await populateForm(selectedSubmission.id);
                }
            } else {
                alert('No previous submissions found.');
            }
        });

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
            const submissionId = document.getElementById('submissionId').value;

            try {
                const endpoint = submissionId ? '/edit-form' : '/submit-form';
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'User-ID': userId
                    },
                    body: formData,
                });
                const result = await response.json();
                if (result.success) {
                    // Show success animation
                    messageElement.textContent = submissionId ? 'Form updated successfully!' : 'Form submitted successfully!';
                    messageElement.style.display = 'block';
                    messageElement.className = 'message success';
                    messageElement.style.animation = 'bounceIn 0.5s ease-out';

                    // Reset form after submission
                    form.reset();
                    document.getElementById('submissionId').value = '';
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

// Common function to fetch user submissions
async function fetchUserSubmissions() {
    const formName = document.getElementById('formName').value;
    const response = await fetch(`/api/user-submissions?formName=${formName}`, {
        headers: { 'User-ID': localStorage.getItem('userId') }
    });
    return await response.json();
}

// Common function to select a submission
async function selectSubmission(submissions) {
    const options = submissions.map(s => `<option value="${s.id}">${s.policy_title || s.role || s.employee_name || s.asset_id || s.control_type || s.location || s.system_application || s.incident_description || s.project_name || s.supplier_name || s.incident_id || s.test_objective || s.legislation_regulation} (${new Date(s.submission_time).toLocaleString()})</option>`).join('');
    const result = await new Promise(resolve => {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
            <form method="dialog">
                <h2>Select a submission to edit</h2>
                <select name="submissionId">
                    ${options}
                </select>
                <div>
                    <button value="cancel">Cancel</button>
                    <button value="confirm">Confirm</button>
                </div>
            </form>
        `;
        dialog.addEventListener('close', () => {
            resolve(dialog.returnValue === 'confirm' ? { id: dialog.querySelector('select').value } : null);
            dialog.remove();
        });
        document.body.appendChild(dialog);
        dialog.showModal();
    });
    return result;
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
                field.value = submission[key];
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