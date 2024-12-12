import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'forms.db'));

// Create tables for each form
db.exec(`
    CREATE TABLE IF NOT EXISTS information_security_policy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        policy_title TEXT,
        review_date TEXT,
        reviewed_by TEXT,
        review_outcome TEXT,
        comments TEXT
    );

    CREATE TABLE IF NOT EXISTS information_security_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT,
        responsible_person TEXT,
        security_responsibilities TEXT,
        date_assigned TEXT,
        review_frequency TEXT,
        comments TEXT
    );

    CREATE TABLE IF NOT EXISTS employee_screening (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT,
        employee_id TEXT,
        position TEXT,
        screening_date TEXT,
        training_completed TEXT,
        training_date TEXT,
        termination_date TEXT,
        training_status TEXT
    );

    CREATE TABLE IF NOT EXISTS asset_management (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        asset_id TEXT,
        asset_type TEXT,
        owner TEXT,
        classification TEXT,
        location TEXT,
        date_added TEXT,
        end_of_life TEXT,
        status TEXT,
        comments TEXT
    );

    CREATE TABLE IF NOT EXISTS access_control (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_name TEXT,
        department TEXT,
        access_requested TEXT,
        reason_for_access TEXT,
        requested_by TEXT,
        date_of_request TEXT,
        approved_by TEXT,
        access_granted TEXT,
        access_dates TEXT,
        comments TEXT,
        type_of_access TEXT,
        access_duration TEXT
    );

    CREATE TABLE IF NOT EXISTS cryptography_controls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        control_type TEXT,
        system_application TEXT,
        purpose TEXT,
        implementation_date TEXT,
        key_management_process TEXT,
        key_expiration_date TEXT,
        comments TEXT,
        key_backup_location TEXT,
        algorithm TEXT
    );

    CREATE TABLE IF NOT EXISTS physical_security (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        location TEXT,
        date_of_inspection TEXT,
        physical_barriers TEXT,
        entry_control_systems TEXT,
        secure_storage_areas TEXT,
        fire_protection_systems TEXT,
        alarm_systems TEXT,
        comments TEXT,
        inspection_frequency TEXT,
        access_approval_authority TEXT
    );

    CREATE TABLE IF NOT EXISTS operations_security (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT,
        system_application TEXT,
        activity_description TEXT,
        performed_by TEXT,
        actions_taken TEXT,
        review_outcome TEXT,
        comments TEXT,
        escalation_contact TEXT,
        downtime_log TEXT
    );

    CREATE TABLE IF NOT EXISTS network_incidents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_of_incident TEXT,
        incident_description TEXT,
        system_affected TEXT,
        incident_response_actions TEXT,
        status TEXT,
        severity_level TEXT,
        incident_handler TEXT,
        resolution_date TEXT,
        encryption_standard TEXT,
        monitoring_details TEXT
    );

    CREATE TABLE IF NOT EXISTS development_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT,
        date TEXT,
        security_requirements_defined TEXT,
        secure_coding_practices TEXT,
        code_review_conducted TEXT,
        vulnerability_testing TEXT,
        security_features TEXT,
        comments TEXT,
        risk_assessment TEXT,
        checklist_completed TEXT
    );

    CREATE TABLE IF NOT EXISTS supplier_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        supplier_name TEXT,
        service_products TEXT,
        security_requirements TEXT,
        audits_performed TEXT,
        audit_date TEXT,
        audit_findings TEXT,
        action_plan TEXT,
        comments TEXT,
        contract_validity TEXT,
        compliance_agreement TEXT
    );

    CREATE TABLE IF NOT EXISTS incident_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id TEXT,
        date_of_incident TEXT,
        incident_description TEXT,
        severity TEXT,
        impact_assessment TEXT,
        actions_taken TEXT,
        resolution_date TEXT,
        handled_by TEXT,
        post_incident_review_date TEXT,
        root_cause_analysis TEXT,
        incident_response_details TEXT
    );

    CREATE TABLE IF NOT EXISTS business_continuity (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_date TEXT,
        test_objective TEXT,
        test_scenario TEXT,
        outcome TEXT,
        issues_identified TEXT,
        follow_up_actions TEXT,
        tested_by TEXT,
        next_test_date TEXT,
        alternative_location TEXT,
        test_results TEXT
    );

    CREATE TABLE IF NOT EXISTS compliance_checklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        legislation_regulation TEXT,
        compliance_requirement TEXT,
        compliance_review_date TEXT,
        compliance_status TEXT,
        non_compliance_issues TEXT,
        action_plan TEXT,
        review_completed_by TEXT,
        internal_audit_date TEXT
    );
`);

export default db;
