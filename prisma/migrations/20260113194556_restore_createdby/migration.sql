-- AlterTable
ALTER TABLE `requests` ADD COLUMN `created_by` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `requests` ADD CONSTRAINT `requests_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
