import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));

// Middleware to check if user is authenticated
const authenticateUser = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.redirect('/login.html');
  }
  // You might want to check if the user exists in the database here
  req.userId = userId;
  next();
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.get('/index.html', authenticateUser, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.post('/api/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    db.prepare('INSERT INTO users (id, username, password) VALUES (?, ?, ?)').run(userId, username, hashedPassword);
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid username or password' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Invalid username or password' });
    }
    res.json({ success: true, userId: user.id, username: user.username });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/submit-form', authenticateUser, async (req, res) => {
  try {
    const { formName, formData } = req.body;
    const userId = req.userId;
    const username = db.prepare('SELECT username FROM users WHERE id = ?').get(userId).username;
    const submissionTime = new Date().toISOString();

    console.log('Received form submission:', formName, formData);
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = `
          INSERT INTO information_security_policy 
          (policy_title, review_date, reviewed_by, review_outcome, comments, user_id, username, submission_time, modified_on, modified_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.prepare(query).run(
          formData.policy_title,
          formData.review_date,
          formData.reviewed_by,
          formData.review_outcome,
          formData.comments,
          userId,
          username,
          submissionTime,
          submissionTime,
          username
        );
        break;

      // Existing cases for other forms remain unchanged
      
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    console.log('Form data inserted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in form submission:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/edit-form', authenticateUser, async (req, res) => {
  try {
    const { formName, formData, submissionId } = req.body;
    const userId = req.userId;
    const username = db.prepare('SELECT username FROM users WHERE id = ?').get(userId).username;
    const modifiedOn = new Date().toISOString();

    console.log('Received form edit:', formName, formData, submissionId);
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = `
          UPDATE information_security_policy 
          SET policy_title = ?, review_date = ?, reviewed_by = ?, review_outcome = ?, comments = ?, modified_on = ?, modified_by = ?
          WHERE id = ? AND user_id = ?
        `;
        db.prepare(query).run(
          formData.policy_title,
          formData.review_date,
          formData.reviewed_by,
          formData.review_outcome,
          formData.comments,
          modifiedOn,
          username,
          submissionId,
          userId
        );
        break;

      // Add similar cases for other forms
      
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    console.log('Form data updated successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in form edit:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/roles', async (req, res) => {
  try {
    const roles = db.prepare('SELECT role_name FROM roles').all();
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.get('/api/extract-data', async (req, res) => {
  try {
    const formName = req.query.formName;
    if (!formName) {
      return res.status(400).json({ error: 'Form name is required' });
    }

    const query = `SELECT * FROM ${formName}`;
    const rows = db.prepare(query).all();

    res.json(rows);
  } catch (error) {
    console.error('Error extracting data:', error);
    res.status(500).json({ error: 'Failed to extract data' });
  }
});

app.post('/api/logout', authenticateUser, (req, res) => {
  // In a real-world scenario, you might want to invalidate the session here
  // For now, we'll just send a success response
  res.json({ success: true, message: 'Logged out successfully' });
});

app.get('/api/user-submissions', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const formName = req.query.formName;
    
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = 'SELECT id, policy_title, submission_time FROM information_security_policy WHERE user_id = ?';
        break;
      // Add cases for other forms
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    const submissions = db.prepare(query).all(userId);
    res.json(submissions);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ error: 'Failed to fetch user submissions' });
  }
});

app.get('/api/submission/:formName/:id', authenticateUser, async (req, res) => {
  try {
    const { formName, id } = req.params;
    const userId = req.userId;
    
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = 'SELECT * FROM information_security_policy WHERE id = ? AND user_id = ?';
        break;
      // Add cases for other forms
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }
    
    const submission = db.prepare(query).get(id, userId);
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

export default app;

