-- Core schema aligned with backend runtime queries.
-- If needed, update database name before running.

CREATE DATABASE IF NOT EXISTS beral_care CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beral_care;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patient', 'doctor', 'admin') DEFAULT 'patient',
    patient_id VARCHAR(20) UNIQUE DEFAULT NULL,
    suspended TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(200) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(15),
    contact_info VARCHAR(200),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    contact_info VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consultations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
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

CREATE TABLE IF NOT EXISTS doctor_patient_access (
    id INT PRIMARY KEY AUTO_INCREMENT,
    doctor_id INT NOT NULL,
    patient_user_id INT NOT NULL,
    status ENUM('pending', 'approved', 'denied') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_access (doctor_id, patient_user_id),
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_consultation_patient ON consultations(patient_id);
CREATE INDEX idx_consultation_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultation_date ON consultations(consultation_date);
