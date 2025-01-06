import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import fs from 'fs/promises';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs2 from 'fs';
import path2 from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/css', express.static(path.join(__dirname, '..', 'frontend', 'css')));

const uploadDir = path2.join(__dirname, '..', 'uploads');
if (!fs2.existsSync(uploadDir)) {
  fs2.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileId = uuidv4();
    const ext = path2.extname(file.originalname);
    cb(null, `${fileId}${ext}`);
  }
});

const upload = multer({ storage: storage });

// Middleware to check if user is authenticated
const authenticateUser = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // You might want to check if the user exists in the database here
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
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

app.post('/submit-form', authenticateUser, upload.single('policy_document'), async (req, res) => {
  try {
    const formName = req.body.formName;
    const userId = req.userId;
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const username = user.username;
    const submissionTime = new Date().toISOString();

    console.log('Received form submission:', formName, req.body);
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        const fileId = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO information_security_policy 
          (policy_title, review_date, reviewed_by, review_outcome, comments, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = db.prepare(query).run(
          req.body.policy_title,
          req.body.review_date,
          req.body.reviewed_by,
          req.body.review_outcome,
          req.body.comments,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileId,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileId, req.file.originalname, userId, result.lastInsertRowid, 'information_security_policy');

        break;

      case 'Information Security Roles':
        const fileIdRoles = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO information_security_roles 
          (role, responsible_person, security_responsibilities, date_assigned, review_frequency, comments, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultRoles = db.prepare(query).run(
          req.body.role,
          req.body.responsible_person,
          req.body.security_responsibilities,
          req.body.date_assigned,
          req.body.review_frequency,
          req.body.comments,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileIdRoles,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileIdRoles, req.file.originalname, userId, resultRoles.lastInsertRowid, 'information_security_roles');

        break;

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

app.post('/edit-form', authenticateUser, upload.single('policy_document'), async (req, res) => {
  try {
    const { formName, submissionId } = req.body;
    const userId = req.userId;
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
    const username = user.username;
    const modifiedOn = new Date().toISOString();

    console.log('Received form edit:', formName, req.body, submissionId);
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        const currentSubmission = db.prepare('SELECT file_id FROM information_security_policy WHERE id = ? AND user_id = ?').get(submissionId, userId);
        if (!currentSubmission) {
          return res.status(404).json({ error: 'Submission not found' });
        }

        if (req.file) {
          // Delete the old file
          const oldFilePath = path2.join(uploadDir, `${currentSubmission.file_id}${path2.extname(req.file.originalname)}`);
          if (fs2.existsSync(oldFilePath)) {
            fs2.unlinkSync(oldFilePath);
          }

          const newFileId = path2.parse(req.file.filename).name;

          query = `
            UPDATE information_security_policy 
            SET policy_title = ?, review_date = ?, reviewed_by = ?, review_outcome = ?, comments = ?, modified_on = ?, modified_by = ?, file_id = ?, file_name = ?
            WHERE id = ? AND user_id = ?
          `;
          db.prepare(query).run(
            req.body.policy_title,
            req.body.review_date,
            req.body.reviewed_by,
            req.body.review_outcome,
            req.body.comments,
            modifiedOn,
            username,
            newFileId,
            req.file.originalname,
            submissionId,
            userId
          );

          // Update file info
          db.prepare(`
            UPDATE file_info
            SET file_id = ?, original_filename = ?
            WHERE form_id = ? AND form_type = 'information_security_policy'
          `).run(newFileId, req.file.originalname, submissionId);
        } else {
          query = `
            UPDATE information_security_policy 
            SET policy_title = ?, review_date = ?, reviewed_by = ?, review_outcome = ?, comments = ?, modified_on = ?, modified_by = ?
            WHERE id = ? AND user_id = ?
          `;
          db.prepare(query).run(
            req.body.policy_title,
            req.body.review_date,
            req.body.reviewed_by,
            req.body.review_outcome,
            req.body.comments,
            modifiedOn,
            username,
            submissionId,
            userId
          );
        }
        break;

      case 'Information Security Roles':
        const currentSubmissionRoles = db.prepare('SELECT file_id FROM information_security_roles WHERE id = ? AND user_id = ?').get(submissionId, userId);
        if (!currentSubmissionRoles) {
          return res.status(404).json({ error: 'Submission not found' });
        }

        if (req.file) {
          // Delete the old file
          const oldFilePathRoles = path2.join(uploadDir, `${currentSubmissionRoles.file_id}${path2.extname(req.file.originalname)}`);
          if (fs2.existsSync(oldFilePathRoles)) {
            fs2.unlinkSync(oldFilePathRoles);
          }

          const newFileIdRoles = path2.parse(req.file.filename).name;

          query = `
            UPDATE information_security_roles 
            SET role = ?, responsible_person = ?, security_responsibilities = ?, date_assigned = ?, review_frequency = ?, comments = ?, modified_on = ?, modified_by = ?, file_id = ?, file_name = ?
            WHERE id = ? AND user_id = ?
          `;
          db.prepare(query).run(
            req.body.role,
            req.body.responsible_person,
            req.body.security_responsibilities,
            req.body.date_assigned,
            req.body.review_frequency,
            req.body.comments,
            modifiedOn,
            username,
            newFileIdRoles,
            req.file.originalname,
            submissionId,
            userId
          );

          // Update file info
          db.prepare(`
            UPDATE file_info
            SET file_id = ?, original_filename = ?
            WHERE form_id = ? AND form_type = 'information_security_roles'
          `).run(newFileIdRoles, req.file.originalname, submissionId);
        } else {
          query = `
            UPDATE information_security_roles 
            SET role = ?, responsible_person = ?, security_responsibilities = ?, date_assigned = ?, review_frequency = ?, comments = ?, modified_on = ?, modified_by = ?
            WHERE id = ? AND user_id = ?
          `;
          db.prepare(query).run(
            req.body.role,
            req.body.responsible_person,
            req.body.security_responsibilities,
            req.body.date_assigned,
            req.body.review_frequency,
            req.body.comments,
            modifiedOn,
            username,
            submissionId,
            userId
          );
        }
        break;

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

app.get('/api/roles', authenticateUser, async (req, res) => {
  try {
      const roles = db.prepare('SELECT role_name FROM roles').all();
      res.json(roles);
  } catch (error) {
      console.error('Error fetching roles:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

app.get('/api/extract-data', authenticateUser, async (req, res) => {
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
      case 'Information Security Roles':
        query = 'SELECT id, role, responsible_person, submission_time FROM information_security_roles WHERE user_id = ?';
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
      case 'Information Security Roles':
        query = 'SELECT * FROM information_security_roles WHERE id = ? AND user_id = ?';
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

app.get('/download-policy/:fileId', authenticateUser, (req, res) => {
  const { fileId } = req.params;
  const userId = req.userId;

  const fileInfo = db.prepare('SELECT original_filename FROM file_info WHERE file_id = ? AND user_id = ?').get(fileId, userId);
  if (!fileInfo) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path2.join(uploadDir, `${fileId}${path2.extname(fileInfo.original_filename)}`);
  if (!fs2.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath, fileInfo.original_filename);
});

export default app;