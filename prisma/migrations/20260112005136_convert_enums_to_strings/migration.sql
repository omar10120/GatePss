-- Convert ENUM columns to VARCHAR for easier maintenance
-- This migration converts all database-level ENUMs to VARCHAR fields
-- Existing data will be preserved automatically

-- Convert users.role from ENUM to VARCHAR
ALTER TABLE `users` MODIFY COLUMN `role` VARCHAR(50) NOT NULL DEFAULT 'SUB_ADMIN';

-- Convert requests.gender from ENUM to VARCHAR
ALTER TABLE `requests` MODIFY COLUMN `gender` VARCHAR(20) NOT NULL;

-- Convert requests.request_type from ENUM to VARCHAR
ALTER TABLE `requests` MODIFY COLUMN `request_type` VARCHAR(50) NOT NULL;

-- Convert requests.status from ENUM to VARCHAR
ALTER TABLE `requests` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'PENDING';

-- Convert activity_logs.action_type from ENUM to VARCHAR
ALTER TABLE `activity_logs` MODIFY COLUMN `action_type` VARCHAR(50) NOT NULL;

-- Convert notifications.action_type from ENUM to VARCHAR
ALTER TABLE `notifications` MODIFY COLUMN `action_type` VARCHAR(50) NOT NULL;
