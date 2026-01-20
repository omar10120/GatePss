-- AlterTable
ALTER TABLE `requests` MODIFY `passport_id_image_path` TEXT NULL,
    MODIFY `photo_path` TEXT NULL;

-- AlterTable
ALTER TABLE `uploads` MODIFY `file_path` TEXT NOT NULL;
