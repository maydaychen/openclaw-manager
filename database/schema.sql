-- OpenClaw Manager Database Schema

CREATE DATABASE IF NOT EXISTS openclaw_manager 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE openclaw_manager;

-- Token usage tracking
CREATE TABLE IF NOT EXISTS token_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    total_tokens BIGINT UNSIGNED NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_workspace_date (workspace, date),
    INDEX idx_date (date),
    INDEX idx_workspace (workspace)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Backup records
CREATE TABLE IF NOT EXISTS backups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    workspace VARCHAR(50) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT UNSIGNED,
    drive_file_id VARCHAR(100),
    drive_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_workspace (workspace),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
