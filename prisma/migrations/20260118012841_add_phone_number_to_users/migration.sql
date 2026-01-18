-- AlterTable
ALTER TABLE `users` ADD COLUMN `phone_number` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `user_permissions_user_id_idx` ON `user_permissions`(`user_id`);
