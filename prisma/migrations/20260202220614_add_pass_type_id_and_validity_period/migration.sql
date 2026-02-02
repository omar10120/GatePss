-- AlterTable
ALTER TABLE `requests` ADD COLUMN `pass_type_id` INTEGER NULL,
    ADD COLUMN `validity_period` VARCHAR(191) NULL;
