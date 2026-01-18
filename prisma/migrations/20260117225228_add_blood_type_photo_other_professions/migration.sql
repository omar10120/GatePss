-- AlterTable
ALTER TABLE `requests` ADD COLUMN `blood_type` VARCHAR(191) NULL,
    ADD COLUMN `other_professions` VARCHAR(191) NULL,
    ADD COLUMN `photo_path` VARCHAR(191) NULL,
    MODIFY `applicant_phone` VARCHAR(191) NULL;
