/*
  Warnings:

  - You are about to drop the column `applicant_name_ar` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `applicant_name_en` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `applicant_phone` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `identification` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `organization` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `pass_type_id` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `profession` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `valid_from` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `valid_to` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `picture` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `fqa` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pass_types` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `applicant_name` to the `requests` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `activity_logs_affected_entity_id_fkey` ON `activity_logs`;

-- DropIndex
DROP INDEX `requests_valid_from_idx` ON `requests`;

-- DropIndex
DROP INDEX `requests_valid_to_idx` ON `requests`;

-- AlterTable
ALTER TABLE `activity_logs` MODIFY `action_type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `requests` DROP COLUMN `applicant_name_ar`,
    DROP COLUMN `applicant_name_en`,
    DROP COLUMN `applicant_phone`,
    DROP COLUMN `gender`,
    DROP COLUMN `identification`,
    DROP COLUMN `nationality`,
    DROP COLUMN `organization`,
    DROP COLUMN `pass_type_id`,
    DROP COLUMN `profession`,
    DROP COLUMN `valid_from`,
    DROP COLUMN `valid_to`,
    ADD COLUMN `applicant_name` VARCHAR(191) NOT NULL,
    ADD COLUMN `extra_fields` JSON NULL,
    MODIFY `request_type` VARCHAR(191) NOT NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `users` DROP COLUMN `phone`,
    DROP COLUMN `picture`,
    MODIFY `role` VARCHAR(191) NOT NULL DEFAULT 'SUB_ADMIN';

-- DropTable
DROP TABLE `fqa`;

-- DropTable
DROP TABLE `notifications`;

-- DropTable
DROP TABLE `pass_types`;

-- CreateIndex
CREATE INDEX `requests_date_of_visit_idx` ON `requests`(`date_of_visit`);
