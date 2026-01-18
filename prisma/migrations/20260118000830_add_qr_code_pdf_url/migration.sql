-- AlterTable
ALTER TABLE `requests` ADD COLUMN `qr_code_pdf_url` VARCHAR(191) NULL;

-- RenameIndex
ALTER TABLE `notifications` RENAME INDEX `notifications_user_id_fkey` TO `notifications_user_id_idx`;

-- RenameIndex
ALTER TABLE `requests` RENAME INDEX `requests_approved_by_fkey` TO `requests_approved_by_idx`;

-- RenameIndex
ALTER TABLE `uploads` RENAME INDEX `uploads_request_id_fkey` TO `uploads_request_id_idx`;

-- RenameIndex
ALTER TABLE `user_permissions` RENAME INDEX `user_permissions_permission_id_fkey` TO `user_permissions_permission_id_idx`;
