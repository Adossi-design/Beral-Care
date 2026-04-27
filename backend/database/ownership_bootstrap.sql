-- Ownership bootstrap for a private MySQL setup
-- Run as an admin user, then switch your app to APP_DB_USER.

-- 1) Set your custom names here
SET @APP_DB_NAME = 'beral_care';
SET @APP_DB_USER = 'beral_care';
SET @APP_DB_PASSWORD = 'replace_with_strong_password';

-- 2) Create database
SET @sql_create_db = CONCAT('CREATE DATABASE IF NOT EXISTS `', @APP_DB_NAME, '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
PREPARE stmt FROM @sql_create_db;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Create app user (localhost + wildcard host)
SET @sql_create_user_local = CONCAT("CREATE USER IF NOT EXISTS '", @APP_DB_USER, "'@'localhost' IDENTIFIED BY '", @APP_DB_PASSWORD, "'");
PREPARE stmt FROM @sql_create_user_local;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_create_user_any = CONCAT("CREATE USER IF NOT EXISTS '", @APP_DB_USER, "'@'%' IDENTIFIED BY '", @APP_DB_PASSWORD, "'");
PREPARE stmt FROM @sql_create_user_any;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Grant only this database permissions
SET @sql_grant_local = CONCAT("GRANT ALL PRIVILEGES ON `", @APP_DB_NAME, "`.* TO '", @APP_DB_USER, "'@'localhost'");
PREPARE stmt FROM @sql_grant_local;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql_grant_any = CONCAT("GRANT ALL PRIVILEGES ON `", @APP_DB_NAME, "`.* TO '", @APP_DB_USER, "'@'%'");
PREPARE stmt FROM @sql_grant_any;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

FLUSH PRIVILEGES;

-- 5) Confirm
SELECT @APP_DB_NAME AS database_name, @APP_DB_USER AS app_user;
