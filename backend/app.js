import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
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
    const { email, username, password, usertype } = req.body;
    const existingEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    db.prepare('INSERT INTO users (id, email, username, password, usertype) VALUES (?, ?, ?, ?, ?)').run(
      userId,
      email,
      username,
      hashedPassword,
      usertype
    );
    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
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
    const submissionTime = new Date().toISOString();

    console.log('Received form submission:', formName, req.body);
    let query = '';
    let tableName = '';

    switch (formName) {
      case 'Information Security Policy Review':
        tableName = 'information_security_policy';
        break;
      case 'Information Security Roles and Responsibilities':
        tableName = 'information_security_roles';
        break;
      case 'Employee Screening and Training Record':
        tableName = 'employee_screening';
        break;
      case 'Asset Inventory':
        tableName = 'asset_inventory';
        break;
      case 'Access Control Request':
        tableName = 'access_control_request';
        break;
      case 'Cryptographic Control Use':
        tableName = 'cryptographic_control';
        break;
      case 'Physical Security Checklist':
        tableName = 'physical_security_checklist';
        break;
      case 'Operations Security Log':
        tableName = 'operations_security_log';
        break;
      case 'Network Security Incident Log':
        tableName = 'network_security_incident_log';
        break;
      case 'Secure Development Checklist':
        tableName = 'secure_development_checklist';
        break;
      case 'Supplier Security Assessment':
        tableName = 'supplier_security_assessment';
        break;
      case 'Incident Response Report':
        tableName = 'incident_response_report';
        break;
      case 'Business Continuity Plan Testing Log':
        tableName = 'business_continuity_plan_testing_log';
        break;
      case 'Legal and Regulatory Compliance Checklist':
        tableName = 'legal_regulatory_compliance_checklist';
        break;
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }

    // Check if the submission is in "Needs revision" state
    const existingSubmission = db.prepare(`SELECT * FROM ${tableName} WHERE user_id = ? AND review_status = ?`).get(userId, 'Needs revision');
    if (existingSubmission) {
      const fileId = req.file ? path2.parse(req.file.filename).name : existingSubmission.file_id;
      const fileName = req.file ? req.file.originalname : existingSubmission.file_name;

      query = `
        UPDATE ${tableName}
        SET policy_title = ?, comments = ?, review_status = 'review', file_id = ?, file_name = ?, modified_on = ?, modified_by = ?
        WHERE id = ?
      `;
      db.prepare(query).run(
        req.body.policy_title,
        req.body.comments,
        fileId,
        fileName,
        submissionTime,
        user.username,
        existingSubmission.id
      );
    } else {
      const fileId = req.file ? path2.parse(req.file.filename).name : null;
      const fileName = req.file ? req.file.originalname : null;

      query = `
        INSERT INTO ${tableName} 
        (policy_title, review_date, upload_date, reviewed_by, review_status, comments, user_id, uploaded_by, submission_time, modified_on, modified_by, file_id, file_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      db.prepare(query).run(
        req.body.policy_title,
        null,
        submissionTime,
        '',
        'review',
        req.body.comments,
        userId,
        user.username,
        submissionTime,
        submissionTime,
        user.username,
        fileId,
        fileName
      );
    }

    console.log('Form data inserted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error in form submission:', error);
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

app.get('/api/user-role', authenticateUser, async (req, res) => {
  try {
    const userId = req.userId;
    const user = db.prepare('SELECT usertype FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, usertype: user.usertype });
  } catch (error) {
    console.error('Error fetching user role:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
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
      case 'Information Security Roles and Responsibilities':
        query = 'SELECT id, policy_title, submission_time FROM information_security_roles WHERE user_id = ?';
        break;
      case 'Employee Screening and Training Record':
        query = 'SELECT id, policy_title, submission_time FROM employee_screening WHERE user_id = ?';
        break;
      case 'Asset Inventory':
        query = 'SELECT id, policy_title, submission_time FROM asset_inventory WHERE user_id = ?';
        break;
      case 'Access Control Request':
        query = 'SELECT id, policy_title, submission_time FROM access_control_request WHERE user_id = ?';
        break;
      case 'Cryptographic Control Use':
        query = 'SELECT id, policy_title, submission_time FROM cryptographic_control WHERE user_id = ?';
        break;
      case 'Physical Security Checklist':
        query = 'SELECT id, policy_title, submission_time FROM physical_security_checklist WHERE user_id = ?';
        break;
      case 'Operations Security Log':
        query = 'SELECT id, policy_title, submission_time FROM operations_security_log WHERE user_id = ?';
        break;
      case 'Network Security Incident Log':
        query = 'SELECT id, policy_title, submission_time FROM network_security_incident_log WHERE user_id = ?';
        break;
      case 'Secure Development Checklist':
        query = 'SELECT id, policy_title, submission_time FROM secure_development_checklist WHERE user_id = ?';
        break;
      case 'Supplier Security Assessment':
        query = 'SELECT id, policy_title, submission_time FROM supplier_security_assessment WHERE user_id = ?';
        break;
      case 'Incident Response Report':
        query = 'SELECT id, policy_title, submission_time FROM incident_response_report WHERE user_id = ?';
        break;
      case 'Business Continuity Plan Testing Log':
        query = 'SELECT id, policy_title, submission_time FROM business_continuity_plan_testing_log WHERE user_id = ?';
        break;
      case 'Legal and Regulatory Compliance Checklist':
        query = 'SELECT id, policy_title, submission_time FROM legal_regulatory_compliance_checklist WHERE user_id = ?';
        break;
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
      case 'Information Security Roles and Responsibilities':
        query = 'SELECT * FROM information_security_roles WHERE id = ? AND user_id = ?';
        break;
      case 'Employee Screening and Training Record':
        query = 'SELECT * FROM employee_screening WHERE id = ? AND user_id = ?';
        break;
      case 'Asset Inventory':
        query = 'SELECT * FROM asset_inventory WHERE id = ? AND user_id = ?';
        break;
      case 'Access Control Request':
        query = 'SELECT * FROM access_control_request WHERE id = ? AND user_id = ?';
        break;
      case 'Cryptographic Control Use':
        query = 'SELECT * FROM cryptographic_control WHERE id = ? AND user_id = ?';
        break;
      case 'Physical Security Checklist':
        query = 'SELECT * FROM physical_security_checklist WHERE id = ? AND user_id = ?';
        break;
      case 'Operations Security Log':
        query = 'SELECT * FROM operations_security_log WHERE id = ? AND user_id = ?';
        break;
      case 'Network Security Incident Log':
        query = 'SELECT * FROM network_security_incident_log WHERE id = ? AND user_id = ?';
        break;
      case 'Secure Development Checklist':
        query = 'SELECT * FROM secure_development_checklist WHERE id = ? AND user_id = ?';
        break;
      case 'Supplier Security Assessment':
        query = 'SELECT * FROM supplier_security_assessment WHERE id = ? AND user_id = ?';
        break;
      case 'Incident Response Report':
        query = 'SELECT * FROM incident_response_report WHERE id = ? AND user_id = ?';
        break;
      case 'Business Continuity Plan Testing Log':
        query = 'SELECT * FROM business_continuity_plan_testing_log WHERE id = ? AND user_id = ?';
        break;
      case 'Legal and Regulatory Compliance Checklist':
        query = 'SELECT * FROM legal_regulatory_compliance_checklist WHERE id = ? AND user_id = ?';
        break;
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

app.get('/api/last-submission/:formName', authenticateUser, async (req, res) => {
  try {
    const { formName } = req.params;
    let query = '';
    switch (formName) {
      case 'Information Security Policy Review':
        query = 'SELECT * FROM information_security_policy ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Information Security Roles and Responsibilities':
        query = 'SELECT * FROM information_security_roles ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Employee Screening and Training Record':
        query = 'SELECT * FROM employee_screening ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Asset Inventory':
        query = 'SELECT * FROM asset_inventory ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Access Control Request':
        query = 'SELECT * FROM access_control_request ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Cryptographic Control Use':
        query = 'SELECT * FROM cryptographic_control ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Physical Security Checklist':
        query = 'SELECT * FROM physical_security_checklist ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Operations Security Log':
        query = 'SELECT * FROM operations_security_log ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Network Security Incident Log':
        query = 'SELECT * FROM network_security_incident_log ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Secure Development Checklist':
        query = 'SELECT * FROM secure_development_checklist ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Supplier Security Assessment':
        query = 'SELECT * FROM supplier_security_assessment ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Incident Response Report':
        query = 'SELECT * FROM incident_response_report ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Business Continuity Plan Testing Log':
        query = 'SELECT * FROM business_continuity_plan_testing_log ORDER BY submission_time DESC LIMIT 1';
        break;
      case 'Legal and Regulatory Compliance Checklist':
        query = 'SELECT * FROM legal_regulatory_compliance_checklist ORDER BY submission_time DESC LIMIT 1';
        break;
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }

    const lastSubmission = db.prepare(query).get();
    res.json(lastSubmission || null);
  } catch (error) {
    console.error('Error fetching last submission:', error);
    res.status(500).json({ error: 'Failed to fetch last submission' });
  }
});

app.put('/api/update-submission/:formName/:id', authenticateUser, async (req, res) => {
  try {
    const { formName, id } = req.params;
    const { policy_title, review_date, review_status, comments, reviewed_by } = req.body;

    let tableName;
    switch (formName) {
      case 'Information Security Policy Review':
        tableName = 'information_security_policy';
        break;
      case 'Information Security Roles and Responsibilities':
        tableName = 'information_security_roles';
        break;
      case 'Employee Screening and Training Record':
        tableName = 'employee_screening';
        break;
      case 'Asset Inventory':
        tableName = 'asset_inventory';
        break;
      case 'Access Control Request':
        tableName = 'access_control_request';
        break;
      case 'Cryptographic Control Use':
        tableName = 'cryptographic_control';
        break;
      case 'Physical Security Checklist':
        tableName = 'physical_security_checklist';
        break;
      case 'Operations Security Log':
        tableName = 'operations_security_log';
        break;
      case 'Network Security Incident Log':
        tableName = 'network_security_incident_log';
        break;
      case 'Secure Development Checklist':
        tableName = 'secure_development_checklist';
        break;
      case 'Supplier Security Assessment':
        tableName = 'supplier_security_assessment';
        break;
      case 'Incident Response Report':
        tableName = 'incident_response_report';
        break;
      case 'Business Continuity Plan Testing Log':
        tableName = 'business_continuity_plan_testing_log';
        break;
      case 'Legal and Regulatory Compliance Checklist':
        tableName = 'legal_regulatory_compliance_checklist';
        break;
      default:
        return res.status(400).json({ error: 'Invalid form name' });
    }

    const query = `
      UPDATE ${tableName}
      SET policy_title = ?, review_date = ?, review_status = ?, comments = ?, reviewed_by = ?
      WHERE id = ?
    `;

    db.prepare(query).run(policy_title, review_date, review_status, comments, reviewed_by, id);

    res.json({ success: true, message: 'Submission updated successfully' });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ success: false, message: 'Failed to update submission' });
  }
});

export default app;