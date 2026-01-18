-- requests table change is OK
ALTER TABLE `requests`
ADD COLUMN `qr_code_pdf_url` VARCHAR(191) NULL;

-- notifications
ALTER TABLE `notifications`
DROP INDEX `notifications_user_id_fkey`,
ADD INDEX `notifications_user_id_idx` (`user_id`);

-- requests
ALTER TABLE `requests`
DROP INDEX `requests_approved_by_fkey`,
ADD INDEX `requests_approved_by_idx` (`approved_by`);

-- uploads
ALTER TABLE `uploads`
DROP INDEX `uploads_request_id_fkey`,
ADD INDEX `uploads_request_id_idx` (`request_id`);

-- user_permissions
ALTER TABLE `user_permissions`
DROP INDEX `user_permissions_permission_id_fkey`,
ADD INDEX `user_permissions_permission_id_idx` (`permission_id`);
