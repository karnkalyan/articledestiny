-- DropIndex
DROP INDEX `Article_authorId_fkey` ON `article`;

-- DropIndex
DROP INDEX `Comment_articleId_fkey` ON `comment`;

-- DropIndex
DROP INDEX `Comment_parentId_fkey` ON `comment`;

-- DropIndex
DROP INDEX `Comment_userId_fkey` ON `comment`;

-- DropIndex
DROP INDEX `Like_articleId_fkey` ON `like`;

-- DropIndex
DROP INDEX `ReadingHistory_articleId_fkey` ON `readinghistory`;

-- AlterTable
ALTER TABLE `article` ADD COLUMN `canonicalUrl` VARCHAR(191) NULL,
    ADD COLUMN `focusKeyword` VARCHAR(191) NULL,
    ADD COLUMN `metaDescription` TEXT NULL,
    ADD COLUMN `metaKeywords` TEXT NULL,
    ADD COLUMN `metaTitle` VARCHAR(191) NULL,
    ADD COLUMN `ogDescription` TEXT NULL,
    ADD COLUMN `ogImage` VARCHAR(191) NULL,
    ADD COLUMN `ogTitle` VARCHAR(191) NULL,
    ADD COLUMN `seoScore` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `twitterDescription` TEXT NULL,
    ADD COLUMN `twitterImage` VARCHAR(191) NULL,
    ADD COLUMN `twitterTitle` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Article` ADD CONSTRAINT `Article_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Like` ADD CONSTRAINT `Like_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReadingHistory` ADD CONSTRAINT `ReadingHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReadingHistory` ADD CONSTRAINT `ReadingHistory_articleId_fkey` FOREIGN KEY (`articleId`) REFERENCES `Article`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
