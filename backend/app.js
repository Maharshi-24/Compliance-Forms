import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { cors } from 'hono/cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './database.js';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = new Hono();

// Enable CORS
app.use('/*', cors());  

// Serve static files from the frontend directory
app.use('/*', serveStatic({ root: path.join(__dirname, '..', 'frontend') }));

// Route to home page
app.get('/', async (c) => {
  try {
    const filePath = path.join(__dirname, '..', 'frontend', 'index.html');
    const content = await fs.readFile(filePath, 'utf-8');
    return c.html(content);
  } catch (error) {
    console.error('Error serving index.html:', error);
    return c.text('Error serving the page', 500);
  }
});

app.get('/styles.css', async (c) => {
    try {
      const filePath = path.join(__dirname, '..', 'frontend', 'styles.css');
      const content = await fs.readFile(filePath, 'utf-8');
      return c.header('Content-Type', 'text/css').body(content);
    } catch (error) {
      console.error('Error serving styles.css:', error);
      return c.text('Error serving the stylesheet', 500);
    }
  });

// Route to handle individual form pages
app.get('/forms/:formName', async (c) => {
  const formName = c.req.param('formName');
  try {
    const filePath = path.join(__dirname, '..', 'frontend', 'forms', formName);
    const content = await fs.readFile(filePath, 'utf-8');
    return c.html(content);
  } catch (error) {
    console.error(`Error serving ${formName}:`, error);
    return c.text('Form not found', 404);
  }
});

// API to handle form submissions
app.post('/submit-form', async (c) => {
    try {
        const { formName, formData } = await c.req.json();
        console.log('Received form submission:', formName, formData);
        let query = '';
        switch (formName) {
            case 'Information Security Policy Review':
                query = `
                    INSERT INTO information_security_policy 
                    (policy_title, review_date, reviewed_by, review_outcome, comments)
                    VALUES (?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.policy_title,
                    formData.review_date,
                    formData.reviewed_by,
                    formData.review_outcome,
                    formData.comments
                );
                break;

            case 'Information Security Roles':
                query = `
                    INSERT INTO information_security_roles 
                    (role, responsible_person, security_responsibilities, date_assigned, review_frequency, comments)
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.role,
                    formData.responsible_person,
                    formData.security_responsibilities,
                    formData.date_assigned,
                    formData.review_frequency,
                    formData.comments
                );
                break;

            case 'Employee Screening and Training':
                query = `
                    INSERT INTO employee_screening 
                    (employee_name, employee_id, position, screening_date, training_completed, training_date, termination_date, training_status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.employee_name,
                    formData.employee_id,
                    formData.position,
                    formData.screening_date,
                    formData.training_completed,
                    formData.training_date,
                    formData.termination_date,
                    formData.training_status
                );
                break;

            case 'Asset Management':
                query = `
                    INSERT INTO asset_management 
                    (asset_id, asset_type, owner, classification, location, date_added, end_of_life, status, comments)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.asset_id,
                    formData.asset_type,
                    formData.owner,
                    formData.classification,
                    formData.location,
                    formData.date_added,
                    formData.end_of_life,
                    formData.status,
                    formData.comments
                );
                break;

            case 'Access Control':
                query = `
                    INSERT INTO access_control 
                    (employee_name, department, access_requested, reason_for_access, requested_by, date_of_request, approved_by, access_granted, access_dates, comments, type_of_access, access_duration)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.employee_name,
                    formData.department,
                    formData.access_requested,
                    formData.reason_for_access,
                    formData.requested_by,
                    formData.date_of_request,
                    formData.approved_by,
                    formData.access_granted,
                    formData.access_dates,
                    formData.comments,
                    formData.type_of_access,
                    formData.access_duration
                );
                break;

            case 'Cryptographic Controls':
                query = `
                    INSERT INTO cryptography_controls 
                    (control_type, system_application, purpose, implementation_date, key_management_process, key_expiration_date, comments, key_backup_location, algorithm)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.control_type,
                    formData.system_application,
                    formData.purpose,
                    formData.implementation_date,
                    formData.key_management_process,
                    formData.key_expiration_date,
                    formData.comments,
                    formData.key_backup_location,
                    formData.algorithm
                );
                break;

            case 'Physical Security':
                query = `
                    INSERT INTO physical_security 
                    (location, date_of_inspection, physical_barriers, entry_control_systems, secure_storage_areas, fire_protection_systems, alarm_systems, comments, inspection_frequency, access_approval_authority)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.location,
                    formData.date_of_inspection,
                    formData.physical_barriers,
                    formData.entry_control_systems,
                    formData.secure_storage_areas,
                    formData.fire_protection_systems,
                    formData.alarm_systems,
                    formData.comments,
                    formData.inspection_frequency,
                    formData.access_approval_authority
                );
                break;

            case 'Operations Security':
                query = `
                    INSERT INTO operations_security 
                    (date, system_application, activity_description, performed_by, actions_taken, review_outcome, comments, escalation_contact, downtime_log)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.date,
                    formData.system_application,
                    formData.activity_description,
                    formData.performed_by,
                    formData.actions_taken,
                    formData.review_outcome,
                    formData.comments,
                    formData.escalation_contact,
                    formData.downtime_log
                );
                break;

            case 'Network Incidents':
                query = `
                    INSERT INTO network_incidents 
                    (date_of_incident, incident_description, system_affected, incident_response_actions, status, severity_level, incident_handler, resolution_date, encryption_standard, monitoring_details)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.date_of_incident,
                    formData.incident_description,
                    formData.system_affected,
                    formData.incident_response_actions,
                    formData.status,
                    formData.severity_level,
                    formData.incident_handler,
                    formData.resolution_date,
                    formData.encryption_standard,
                    formData.monitoring_details
                );
                break;

            case 'Development Checklist':
                query = `
                    INSERT INTO development_checklist 
                    (project_name, date, security_requirements_defined, secure_coding_practices, code_review_conducted, vulnerability_testing, security_features, comments, risk_assessment, checklist_completed)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.project_name,
                    formData.date,
                    formData.security_requirements_defined,
                    formData.secure_coding_practices,
                    formData.code_review_conducted,
                    formData.vulnerability_testing,
                    formData.security_features,
                    formData.comments,
                    formData.risk_assessment,
                    formData.checklist_completed
                );
                break;

            case 'Supplier Assessments':
                query = `
                    INSERT INTO supplier_assessments 
                    (supplier_name, service_products, security_requirements, audits_performed, audit_date, audit_findings, action_plan, comments, contract_validity, compliance_agreement)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.supplier_name,
                    formData.service_products,
                    formData.security_requirements,
                    formData.audits_performed,
                    formData.audit_date,
                    formData.audit_findings,
                    formData.action_plan,
                    formData.comments,
                    formData.contract_validity,
                    formData.compliance_agreement
                );
                break;

            case 'Incident Responses':
                query = `
                    INSERT INTO incident_responses 
                    (incident_id, date_of_incident, incident_description, severity, impact_assessment, actions_taken, resolution_date, handled_by, post_incident_review_date, root_cause_analysis, incident_response_details)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.incident_id,
                    formData.date_of_incident,
                    formData.incident_description,
                    formData.severity,
                    formData.impact_assessment,
                    formData.actions_taken,
                    formData.resolution_date,
                    formData.handled_by,
                    formData.post_incident_review_date,
                    formData.root_cause_analysis,
                    formData.incident_response_details
                );
                break;

            case 'Business Continuity':
                query = `
                    INSERT INTO business_continuity 
                    (test_date, test_objective, test_scenario, outcome, issues_identified, follow_up_actions, tested_by, next_test_date, alternative_location, test_results)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.test_date,
                    formData.test_objective,
                    formData.test_scenario,
                    formData.outcome,
                    formData.issues_identified,
                    formData.follow_up_actions,
                    formData.tested_by,
                    formData.next_test_date,
                    formData.alternative_location,
                    formData.test_results
                );
                break;

            case 'Compliance Checklist':
                query = `
                    INSERT INTO compliance_checklist 
                    (legislation_regulation, compliance_requirement, compliance_review_date, compliance_status, non_compliance_issues, action_plan, review_completed_by, internal_audit_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.prepare(query).run(
                    formData.legislation_regulation,
                    formData.compliance_requirement,
                    formData.compliance_review_date,
                    formData.compliance_status,
                    formData.non_compliance_issues,
                    formData.action_plan,
                    formData.review_completed_by,
                    formData.internal_audit_date
                );
                break;

            default:
                return c.json({ error: 'Invalid form name' }, 400);
        }
        
        console.log('Form data inserted successfully');
        return c.json({ success: true });

    } catch (error) {
        console.error('Error in form submission:', error);
        return c.json({ error: error.message }, 500);
    }
});

export default app;