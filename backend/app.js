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
      const { email, username, password, usertype } = req.body; // Include email
      // Check if email already exists
      const existingEmail = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
      if (existingEmail) {
          return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      // Check if username already exists
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
      const { email, password } = req.body; // Changed from username to email
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email); // Changed to query by email
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
    switch (formName) {
      case 'Information Security Policy Review':
        const fileId = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO information_security_policy 
          (policy_title, review_date, reviewed_by, review_status, comments, user_id, uploaded_by, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const result = db.prepare(query).run(
          req.body.policy_title,
          req.body.review_date,
          '',
          'review',
          req.body.comments,
          userId,
          user.username,
          submissionTime,
          submissionTime,
          user.username,
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

      case 'Employee Screening and Training':
        const fileIdScreening = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO employee_screening 
          (employee_name, employee_id, position, screening_date, training_completed, training_date, termination_date, training_status, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultScreening = db.prepare(query).run(
          req.body.employee_name,
          req.body.employee_id,
          req.body.position,
          req.body.screening_date,
          req.body.training_completed,
          req.body.training_date,
          req.body.termination_date,
          req.body.training_status,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileIdScreening,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileIdScreening, req.file.originalname, userId, resultScreening.lastInsertRowid, 'employee_screening');

        break;

      case 'Asset Management':
        const fileIdAsset = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO asset_management 
          (asset_id, asset_type, owner, classification, location, date_added, end_of_life, status, comments, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultAsset = db.prepare(query).run(
          req.body.asset_id,
          req.body.asset_type,
          req.body.owner,
          req.body.classification,
          req.body.location,
          req.body.date_added,
          req.body.end_of_life,
          req.body.status,
          req.body.comments,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileIdAsset,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileIdAsset, req.file.originalname, userId, resultAsset.lastInsertRowid, 'asset_management');

        break;

      case 'Access Control':
        const fileIdAccess = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO access_control 
          (employee_name, department, access_requested, reason_for_access, requested_by, date_of_request, approved_by, access_granted, access_dates, comments, type_of_access, access_duration, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultAccess = db.prepare(query).run(
          req.body.employee_name,
          req.body.department,
          req.body.access_requested,
          req.body.reason_for_access,
          req.body.requested_by,
          req.body.date_of_request,
          req.body.approved_by,
          req.body.access_granted,
          req.body.access_dates,
          req.body.comments,
          req.body.type_of_access,
          req.body.access_duration,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileIdAccess,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileIdAccess, req.file.originalname, userId, resultAccess.lastInsertRowid, 'access_control');

        break;

      case 'Cryptographic Controls':
        const fileIdCrypto = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO cryptography_controls 
          (control_type, system_application, purpose, implementation_date, key_management_process, key_expiration_date, comments, key_backup_location, algorithm, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultCrypto = db.prepare(query).run(
          req.body.control_type,
          req.body.system_application,
          req.body.purpose,
          req.body.implementation_date,
          req.body.key_management_process,
          req.body.key_expiration_date,
          req.body.comments,
          req.body.key_backup_location,
          req.body.algorithm,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileIdCrypto,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileIdCrypto, req.file.originalname, userId, resultCrypto.lastInsertRowid, 'cryptography_controls');

        break;

      case 'Physical Security':
        const fileIdPhysical = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO physical_security 
          (location, date_of_inspection, physical_barriers, entry_control_systems, secure_storage_areas, fire_protection_systems, alarm_systems, comments, inspection_frequency, access_approval_authority, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultPhysical = db.prepare(query).run(
          req.body.location,
          req.body.date_of_inspection,
          req.body.physical_barriers,
          req.body.entry_control_systems,
          req.body.secure_storage_areas,
          req.body.fire_protection_systems,
          req.body.alarm_systems,
          req.body.comments,
          req.body.inspection_frequency,
          req.body.access_approval_authority,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileIdPhysical,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileIdPhysical, req.file.originalname, userId, resultPhysical.lastInsertRowid, 'physical_security');

        break;

      case 'Operations Security Log':
        const fileIdOps = path2.parse(req.file.filename).name;
        query = `
          INSERT INTO operations_security 
          (date, system_application, activity_description, performed_by, actions_taken, review_outcome, comments, escalation_contact, downtime_log, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const resultOps = db.prepare(query).run(
          req.body.date,
          req.body.system_application,
          req.body.activity_description,
          req.body.performed_by,
          req.body.actions_taken,
          req.body.review_outcome,
          req.body.comments,
          req.body.escalation_contact,
          req.body.downtime_log,
          userId,
          username,
          submissionTime,
          submissionTime,
          username,
          fileIdOps,
          req.file.originalname
        );

        // Insert file info
        db.prepare(`
          INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
          VALUES (?, ?, ?, ?, ?)
        `).run(fileIdOps, req.file.originalname, userId, resultOps.lastInsertRowid, 'operations_security');

        break;

        case 'Communications Security':
          const fileIdComm = path2.parse(req.file.filename).name;
          query = `
              INSERT INTO communications_security 
              (date_of_incident, incident_description, system_network_affected, incident_response_actions, status, severity_level, incident_handler, resolution_date, encryption_standard, communication_monitoring, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const resultComm = db.prepare(query).run(
              req.body.date_of_incident,
              req.body.incident_description,
              req.body.system_network_affected,
              req.body.incident_response_actions,
              req.body.status,
              req.body.severity_level,
              req.body.incident_handler,
              req.body.resolution_date,
              req.body.encryption_standard,
              req.body.communication_monitoring,
              userId,
              username,
              submissionTime,
              submissionTime,
              username,
              fileIdComm,
              req.file.originalname
          );

          // Insert file info
          db.prepare(`
              INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
              VALUES (?, ?, ?, ?, ?)
          `).run(fileIdComm, req.file.originalname, userId, resultComm.lastInsertRowid, 'communications_security');
          break;
  
          case 'System Acquisition, Development, and Maintenance':
            const fileIdSys = path2.parse(req.file.filename).name;
            query = `
                INSERT INTO system_acquisition 
                (project_name, date, security_requirements_defined, secure_coding_practices_followed, code_review_conducted, testing_for_vulnerabilities, security_features_implemented, comments, risk_feasibility_assessment, secure_development_checklist, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const resultSys = db.prepare(query).run(
                req.body.project_name,
                req.body.date,
                req.body.security_requirements_defined,
                req.body.secure_coding_practices_followed,
                req.body.code_review_conducted,
                req.body.testing_for_vulnerabilities,
                req.body.security_features_implemented,
                req.body.comments,
                req.body.risk_feasibility_assessment,
                req.body.secure_development_checklist,
                userId,
                username,
                submissionTime,
                submissionTime,
                username,
                fileIdSys,
                req.file.originalname
            );
        
            // Insert file info
            db.prepare(`
                INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
                VALUES (?, ?, ?, ?, ?)
            `).run(fileIdSys, req.file.originalname, userId, resultSys.lastInsertRowid, 'system_acquisition');
            break;

          case 'Supplier Relationships':
              const fileIdSupp = path2.parse(req.file.filename).name;
              query = `
                  INSERT INTO supplier_relationships 
                  (supplier_name, supplier_service_products, security_requirements_in_contract, security_audits_performed, date_of_audit, audit_findings, action_plan, comments, contract_validity, supplier_compliance_contract, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `;
              const resultSupp = db.prepare(query).run(
                  req.body.supplier_name,
                  req.body.supplier_service_products,
                  req.body.security_requirements_in_contract,
                  req.body.security_audits_performed,
                  req.body.date_of_audit,
                  req.body.audit_findings,
                  req.body.action_plan,
                  req.body.comments,
                  req.body.contract_validity,
                  req.body.supplier_compliance_contract,
                  userId,
                  username,
                  submissionTime,
                  submissionTime,
                  username,
                  fileIdSupp,
                  req.file.originalname
              );
          
              // Insert file info
              db.prepare(`
                  INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
                  VALUES (?, ?, ?, ?, ?)
              `).run(fileIdSupp, req.file.originalname, userId, resultSupp.lastInsertRowid, 'supplier_relationships');
              break;

          case 'Information Security Incident Management':
            const fileIdIncident = req.file ? path2.parse(req.file.filename).name : null;
            const fileNameIncident = req.file ? req.file.originalname : null;
        
            query = `
                INSERT INTO incident_management 
                (incident_id, date_of_incident, incident_description, severity, impact_assessment, actions_taken, resolution_date, incident_handled_by, post_incident_review_date, root_cause_analysis, incident_response, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const resultIncident = db.prepare(query).run(
                req.body.incident_id,
                req.body.date_of_incident,
                req.body.incident_description,
                req.body.severity,
                req.body.impact_assessment,
                req.body.actions_taken,
                req.body.resolution_date,
                req.body.incident_handled_by,
                req.body.post_incident_review_date,
                req.body.root_cause_analysis,
                req.body.incident_response,
                userId,
                username,
                submissionTime,
                submissionTime,
                username,
                fileIdIncident,
                fileNameIncident
            );
        
            // Insert file info
            if (fileIdIncident && fileNameIncident) {
                db.prepare(`
                    INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
                    VALUES (?, ?, ?, ?, ?)
                `).run(fileIdIncident, fileNameIncident, userId, resultIncident.lastInsertRowid, 'incident_management');
            }
            break;

          case 'Business Continuity Management':
            const fileIdBCM = req.file ? path2.parse(req.file.filename).name : null;
            const fileNameBCM = req.file ? req.file.originalname : null;
        
            query = `
                INSERT INTO business_continuity 
                (test_date, test_objective, test_scenario, outcome, issues_identified, follow_up_actions, tested_by, next_test_date, alternative_location, continuity_test_results, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const resultBCM = db.prepare(query).run(
                req.body.test_date,
                req.body.test_objective,
                req.body.test_scenario,
                req.body.outcome,
                req.body.issues_identified,
                req.body.follow_up_actions,
                req.body.tested_by,
                req.body.next_test_date,
                req.body.alternative_location,
                req.body.continuity_test_results,
                userId,
                username,
                submissionTime,
                submissionTime,
                username,
                fileIdBCM,
                fileNameBCM
            );
        
            // Insert file info
            if (fileIdBCM && fileNameBCM) {
                db.prepare(`
                    INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
                    VALUES (?, ?, ?, ?, ?)
                `).run(fileIdBCM, fileNameBCM, userId, resultBCM.lastInsertRowid, 'business_continuity');
            }
            break;

          case 'Compliance':
            const fileIdCompliance = path2.parse(req.file.filename).name;
            query = `
              INSERT INTO compliance 
              (legislation_regulation, compliance_requirement, date_of_compliance_review, compliance_status, non_compliance_issues, action_plan_for_non_compliance, review_completed_by, internal_audit_date, user_id, username, submission_time, modified_on, modified_by, file_id, file_name)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const resultCompliance = db.prepare(query).run(
              req.body.legislation_regulation,
              req.body.compliance_requirement,
              req.body.date_of_compliance_review,
              req.body.compliance_status,
              req.body.non_compliance_issues,
              req.body.action_plan_for_non_compliance,
              req.body.review_completed_by,
              req.body.internal_audit_date,
              userId,
              username,
              submissionTime,
              submissionTime,
              username,
              fileIdCompliance,
              req.file.originalname
            );
          
            // Insert file info
            db.prepare(`
              INSERT INTO file_info (file_id, original_filename, user_id, form_id, form_type)
              VALUES (?, ?, ?, ?, ?)
            `).run(fileIdCompliance, req.file.originalname, userId, resultCompliance.lastInsertRowid, 'compliance');
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

    // Fetch data from the corresponding table
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
      case 'Employee Screening and Training':
        query = 'SELECT id, employee_name, submission_time FROM employee_screening WHERE user_id = ?';
        break;
      case 'Asset Management':
        query = 'SELECT id, asset_id, asset_type, submission_time FROM asset_management WHERE user_id = ?';
        break;
      case 'Access Control':
        query = 'SELECT id, employee_name, access_requested, submission_time FROM access_control WHERE user_id = ?';
        break;
      case 'Cryptographic Controls':
        query = 'SELECT id, control_type, system_application, submission_time FROM cryptography_controls WHERE user_id = ?';
        break;
      case 'Physical Security':
        query = 'SELECT id, location, date_of_inspection, submission_time FROM physical_security WHERE user_id = ?';
        break;
      case 'Operations Security Log':
        query = 'SELECT id, system_application, date, submission_time FROM operations_security WHERE user_id = ?';
        break;
      case 'Communications Security':
        query = 'SELECT id, incident_description, date_of_incident, submission_time FROM communications_security WHERE user_id = ?';
        break;
      case 'System Acquisition, Development, and Maintenance':
        query = 'SELECT id, project_name, date, submission_time FROM system_acquisition WHERE user_id = ?';
        break;
      case 'Supplier Relationships':
        query = 'SELECT id, supplier_name, submission_time FROM supplier_relationships WHERE user_id = ?';
        break;
      case 'Information Security Incident Management':
        query = 'SELECT id, incident_id, date_of_incident, submission_time FROM incident_management WHERE user_id = ?';
        break;
      case 'Business Continuity Management':
        query = 'SELECT id, test_objective, test_date, submission_time FROM business_continuity WHERE user_id = ?';
        break;
      case 'Compliance':
        query = 'SELECT id, legislation_regulation, date_of_compliance_review, submission_time FROM compliance WHERE user_id = ?';
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
      case 'Information Security Roles':
        query = 'SELECT * FROM information_security_roles WHERE id = ? AND user_id = ?';
        break;
      case 'Employee Screening and Training':
        query = 'SELECT * FROM employee_screening WHERE id = ? AND user_id = ?';
        break;
      case 'Asset Management':
        query = 'SELECT * FROM asset_management WHERE id = ? AND user_id = ?';
        break;
      case 'Access Control':
        query = 'SELECT * FROM access_control WHERE id = ? AND user_id = ?';
        break;
      case 'Cryptographic Controls':
        query = 'SELECT * FROM cryptography_controls WHERE id = ? AND user_id = ?';
        break;
      case 'Physical Security':
        query = 'SELECT * FROM physical_security WHERE id = ? AND user_id = ?';
        break;
      case 'Operations Security Log':
        query = 'SELECT * FROM operations_security WHERE id = ? AND user_id = ?';
        break;
      case 'Communications Security':
        query = 'SELECT * FROM communications_security WHERE id = ? AND user_id = ?';
        break;
      case 'System Acquisition, Development, and Maintenance':
        query = 'SELECT * FROM system_acquisition WHERE id = ? AND user_id = ?';
        break;
      case 'Supplier Relationships':
        query = 'SELECT * FROM supplier_relationships WHERE id = ? AND user_id = ?';
        break;
      case 'Information Security Incident Management':
        query = 'SELECT * FROM incident_management WHERE id = ? AND user_id = ?';
        break;
      case 'Business Continuity Management':
        query = 'SELECT * FROM business_continuity WHERE id = ? AND user_id = ?';
        break;
      case 'Compliance':
        query = 'SELECT * FROM compliance WHERE id = ? AND user_id = ?';
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
            // Add cases for other forms if needed
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

app.put('/api/update-submission/:id', authenticateUser, async (req, res) => {
  try {
      const { id } = req.params;
      const { policy_title, review_date, review_status, comments, reviewed_by } = req.body;

      // Update the submission in the database
      const query = `
          UPDATE information_security_policy
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