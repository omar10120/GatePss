-- AlterTable
ALTER TABLE `activity_logs` MODIFY `action_type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `requests` MODIFY `request_type` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `users` MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'SUB_ADMIN';
