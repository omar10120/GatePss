-- DropForeignKey
ALTER TABLE `requests` DROP FOREIGN KEY `requests_created_by_fkey`;

-- AlterTable
ALTER TABLE `requests` DROP COLUMN `created_by`;

