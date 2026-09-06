-- Beral Care canonical schema.
-- Run this file once on a fresh database, or use GET /setup-db for automated setup.
-- All table definitions here match what the backend code actually queries.

-- The database keeps its original name so existing deployments and local
-- copies keep working. Only the branding changed, not the schema.
CREATE DATABASE IF NOT EXISTS beral_care CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beral_care;

-- Core users table: stores patients, doctors, and admins in one place.
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    role ENUM('patient', 'doctor', 'admin') DEFAULT 'patient',
    patient_id VARCHAR(20) UNIQUE DEFAULT NULL,
    specialization VARCHAR(100) DEFAULT NULL,
    hospital VARCHAR(200) DEFAULT NULL,
    profile_image_url VARCHAR(500) DEFAULT NULL,
    google_id VARCHAR(255) UNIQUE DEFAULT NULL,
    email_verified TINYINT(1) DEFAULT 0,
    phone_verified TINYINT(1) DEFAULT 0,
    suspended TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Patient extended profile (created automatically on patient registration).
CREATE TABLE IF NOT EXISTS patients (
    id INT PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(15),
    contact_info VARCHAR(200),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Doctor extended profile (created automatically on doctor registration).
CREATE TABLE IF NOT EXISTS doctors (
    id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(50),
    license_number VARCHAR(50) UNIQUE,
    contact_info VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Completed consultation records created by a doctor after a session.
CREATE TABLE IF NOT EXISTS consultations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    request_id INT DEFAULT NULL,
    consultation_date DATE NOT NULL,
    notes TEXT,
    diagnosis TEXT,
    prescription TEXT,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Access requests: a doctor requests access to a patient's records.
-- The patient then approves (accepted) or rejects (rejected) the request.
CREATE TABLE IF NOT EXISTS consultation_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    reason TEXT,
    status ENUM('pending', 'accepted', 'rejected', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_request (patient_id, doctor_id),
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
);

-- In-app notifications for both patients and doctors.
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50),
    related_user_id INT DEFAULT NULL,
    related_consultation_id INT DEFAULT NULL,
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (related_consultation_id) REFERENCES consultations(id) ON DELETE SET NULL
);

-- Performance indexes.
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_patient_id ON users(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_patient ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_doctor ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_date ON consultations(consultation_date);
CREATE INDEX IF NOT EXISTS idx_requests_patient ON consultation_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_requests_doctor ON consultation_requests(doctor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
