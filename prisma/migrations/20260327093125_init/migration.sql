-- AlterTable
ALTER TABLE `requests` MODIFY `applicant_name_en` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,

    UNIQUE INDEX `settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `activity_logs_affected_entity_type_affected_entity_id_idx` ON `activity_logs`(`affected_entity_type`, `affected_entity_id`);
