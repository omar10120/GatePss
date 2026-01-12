-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'SUB_ADMIN') NOT NULL DEFAULT 'SUB_ADMIN',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `phone` VARCHAR(15) NULL,
    `picture` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `permissions_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_permissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `permission_id` INTEGER NOT NULL,

    UNIQUE INDEX `user_permissions_user_id_permission_id_key`(`user_id`, `permission_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicant_name_en` VARCHAR(191) NOT NULL,
    `applicant_name_ar` VARCHAR(191) NOT NULL,
    `applicant_email` VARCHAR(191) NOT NULL,
    `applicant_phone` VARCHAR(15) NULL,
    `gender` ENUM('MALE', 'FEMALE') NOT NULL,
    `profession` VARCHAR(191) NOT NULL,
    `passport_id_number` VARCHAR(191) NOT NULL,
    `passport_id_image_path` VARCHAR(191) NULL,
    `pass_type_id` INTEGER NOT NULL,
    `nationality` VARCHAR(191) NOT NULL,
    `identification` VARCHAR(191) NOT NULL,
    `organization` VARCHAR(191) NOT NULL,
    `valid_from` DATETIME(3) NOT NULL,
    `valid_to` DATETIME(3) NOT NULL,
    `request_type` ENUM('VISITOR', 'CONTRACTOR', 'EMPLOYEE', 'VEHICLE') NOT NULL,
    `purpose_of_visit` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `date_of_visit` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `request_number` VARCHAR(191) NOT NULL,
    `rejection_reason` TEXT NULL,
    `approved_by` INTEGER NULL,
    `external_reference` VARCHAR(191) NULL,
    `last_integration_status_code` INTEGER NULL,
    `last_integration_status_message` TEXT NULL,

    UNIQUE INDEX `requests_request_number_key`(`request_number`),
    INDEX `requests_status_idx`(`status`),
    INDEX `requests_request_type_idx`(`request_type`),
    INDEX `requests_valid_from_idx`(`valid_from`),
    INDEX `requests_valid_to_idx`(`valid_to`),
    INDEX `requests_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pass_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name_en` VARCHAR(191) NOT NULL,
    `name_ar` VARCHAR(191) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uploads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_id` INTEGER NULL,
    `action_type` ENUM('REQUEST_MANAGEMENT', 'USER_MANAGEMENT', 'SYSTEM_INTEGRATION', 'AUTH') NOT NULL,
    `action_performed` VARCHAR(191) NOT NULL,
    `affected_entity_type` VARCHAR(191) NULL,
    `affected_entity_id` INTEGER NULL,
    `details` JSON NULL,

    INDEX `activity_logs_timestamp_idx`(`timestamp`),
    INDEX `activity_logs_action_type_idx`(`action_type`),
    INDEX `activity_logs_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FQA` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `question_en` VARCHAR(191) NOT NULL,
    `question_ar` VARCHAR(191) NOT NULL,
    `answer_en` TEXT NOT NULL,
    `answer_ar` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `action_type` ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    `action_performed` VARCHAR(191) NOT NULL,
    `affected_entity_type` VARCHAR(191) NULL,
    `affected_entity_id` INTEGER NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_approved_by_fkey` FOREIGN KEY (`approved_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uploads` ADD CONSTRAINT `uploads_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_affected_entity_id_fkey` FOREIGN KEY (`affected_entity_id`) REFERENCES `requests`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
