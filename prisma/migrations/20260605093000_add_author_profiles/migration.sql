CREATE TABLE `AuthorProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `bio` TEXT NULL,
    `bioVisible` BOOLEAN NOT NULL DEFAULT true,
    `location` VARCHAR(191) NULL,
    `locationVisible` BOOLEAN NOT NULL DEFAULT true,
    `website` VARCHAR(191) NULL,
    `websiteVisible` BOOLEAN NOT NULL DEFAULT true,
    `twitter` VARCHAR(191) NULL,
    `twitterVisible` BOOLEAN NOT NULL DEFAULT true,
    `github` VARCHAR(191) NULL,
    `githubVisible` BOOLEAN NOT NULL DEFAULT true,
    `linkedin` VARCHAR(191) NULL,
    `linkedinVisible` BOOLEAN NOT NULL DEFAULT true,
    `phone` VARCHAR(191) NULL,
    `phoneVisible` BOOLEAN NOT NULL DEFAULT false,
    `avatar` TEXT NULL,
    `avatarVisible` BOOLEAN NOT NULL DEFAULT true,
    `tagline` VARCHAR(191) NULL,
    `taglineVisible` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AuthorProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AuthorProfile` ADD CONSTRAINT `AuthorProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
