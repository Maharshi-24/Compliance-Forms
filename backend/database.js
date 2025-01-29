import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'compliance.db'));

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT,
        usertype TEXT,
        modified_on TEXT,
        modified_by TEXT
    );
  
    CREATE TABLE IF NOT EXISTS file_info (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id TEXT UNIQUE,
      original_filename TEXT,
      user_id TEXT,
      form_id INTEGER,
      form_type TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  
    CREATE TABLE IF NOT EXISTS information_security_policy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  
    CREATE TABLE IF NOT EXISTS information_security_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  
    CREATE TABLE IF NOT EXISTS employee_screening (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  
    CREATE TABLE IF NOT EXISTS asset_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  
    CREATE TABLE IF NOT EXISTS access_control_request (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  
    CREATE TABLE IF NOT EXISTS cryptographic_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  
    CREATE TABLE IF NOT EXISTS physical_security_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  
    CREATE TABLE IF NOT EXISTS operations_security_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
    
    CREATE TABLE IF NOT EXISTS network_security_incident_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS secure_development_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS supplier_security_assessment (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS incident_response_report (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS business_continuity_plan_testing_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS legal_regulatory_compliance_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT, 
        upload_date TEXT, 
        reviewed_by TEXT,
        review_status TEXT DEFAULT 'review',
        comments TEXT,
        user_id TEXT,
        uploaded_by TEXT,
        submission_time TEXT,
        modified_on TEXT,
        modified_by TEXT,
        file_name TEXT,
        file_id TEXT UNIQUE
    );
  `);

export default db;
