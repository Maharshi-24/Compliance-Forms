document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '/login.html';
    }

    // Fetch the last submission for review
    const formName = document.getElementById('formName').value;
    const lastSubmission = await fetchLastSubmission(formName);

    if (lastSubmission && lastSubmission.review_status === 'review') {
        populateForm(lastSubmission); // Pass the entire submission object
    } else {
        showMessage('No pending reviews found.', 'info');
    }
});

// Fetch the last submission for the current form
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

// Populate form with submission data
function populateForm(submission) {
    console.log('Submission data:', submission); // Debugging: Log the submission data

    document.getElementById('submissionId').value = submission.id;
    document.getElementById('policy_title').value = submission.policy_title;
    document.getElementById('comments').value = submission.comments;

    // Handle file preview
    const fileIcon = document.getElementById('file-icon');
    const fileNameSpan = document.getElementById('file-name');
    const filePreview = document.getElementById('file-preview');

    if (submission.file_name) {
        const fileExtension = submission.file_name.split('.').pop().toLowerCase();
        if (fileExtension === 'pdf') {
            fileIcon.src = '../images/pdf-img.png'; // Path to PDF icon
        } else if (fileExtension === 'doc' || fileExtension === 'docx') {
            fileIcon.src = '../images/word-img.png'; // Path to Word icon
        }

        fileNameSpan.textContent = submission.file_name;
        filePreview.style.display = 'flex'; // Ensure the file preview is visible
    } else {
        fileNameSpan.textContent = 'No file currently uploaded';
        filePreview.style.display = 'none'; // Hide the file preview if no file is uploaded
    }
}

// Form submission logic    
const form = document.querySelector('form');
const messageElement = document.getElementById('message');

if (form && messageElement) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.classList.add('loading');
        submitButton.disabled = true;

        // Show a loading animation for 2 seconds before submitting
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const submissionId = document.getElementById('submissionId').value;

        // Automatically set the review date to the current date
        const reviewDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

        // Prepare the data to be sent
        const updatedData = {
            policy_title: document.getElementById('policy_title').value,
            review_date: reviewDate, // Automatically set the review date
            review_status: document.getElementById('review_status').value,
            comments: document.getElementById('comments').value,
            reviewed_by: username, // Automatically set the reviewer
        };

        try {
            const response = await fetch(`/api/update-submission/${submissionId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'User-ID': userId,
                },
                body: JSON.stringify(updatedData),
            });

            const result = await response.json();

            if (result.success) {
                showMessage('Review submitted successfully!', 'success');
            } else {
                throw new Error(result.error || 'Unknown error');
            }
        } catch (error) {
            console.error('Error:', error);
            showMessage(`Error: ${error.message}`, 'error');
        } finally {
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
        }
    });
}

// Show a message on the screen
function showMessage(message, type) {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.style.display = 'block';
        messageElement.className = `message ${type}`;
        messageElement.style.animation = 'bounceIn 0.5s ease-out';

        // Hide the message after 3 seconds
        setTimeout(() => {
            messageElement.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                messageElement.style.display = 'none';
            }, 500);
        }, 3000);
    }
}