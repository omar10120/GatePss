-- AlterTable: Update photo_path and passport_id_image_path to LONGTEXT to support base64 encoded images
ALTER TABLE `requests` 
    MODIFY `photo_path` LONGTEXT NULL,
    MODIFY `passport_id_image_path` LONGTEXT NULL;

-- AlterTable: Update file_path in uploads table to LONGTEXT to support base64 encoded images
ALTER TABLE `uploads` 
    MODIFY `file_path` LONGTEXT NOT NULL;

