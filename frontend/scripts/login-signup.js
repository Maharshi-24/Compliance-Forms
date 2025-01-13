// Login Form Submission
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (data.success) {
            messageElement.textContent = 'Login successful!';
            messageElement.className = 'message success';
            messageElement.style.display = 'block';
            localStorage.setItem('userId', data.userId);
            localStorage.setItem('username', data.username);
            window.location.href = '/index.html';
        } else {
            throw new Error(data.message || 'Login failed');
        }
    } catch (error) {
        messageElement.textContent = error.message;
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
    }
});

// Signup Form Submission
document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const messageElement = document.getElementById('message');

    if (password !== confirmPassword) {
        messageElement.textContent = 'Passwords do not match';
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
        return;
    }

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (data.success) {
            messageElement.textContent = 'Sign up successful! Please login.';
            messageElement.className = 'message success';
            messageElement.style.display = 'block';
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        } else {
            throw new Error(data.message || 'Sign up failed');
        }
    } catch (error) {
        messageElement.textContent = error.message;
        messageElement.className = 'message error';
        messageElement.style.display = 'block';
    }
});