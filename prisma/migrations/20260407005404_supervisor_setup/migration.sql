/*
  Warnings:

  - You are about to drop the column `supervisor` on the `user` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `account` DROP FOREIGN KEY `Account_userId_fkey`;

-- DropForeignKey
ALTER TABLE `dtrentry` DROP FOREIGN KEY `DTREntry_dtrRecordId_fkey`;

-- DropForeignKey
ALTER TABLE `dtrrecord` DROP FOREIGN KEY `DTRRecord_userId_fkey`;

-- DropForeignKey
ALTER TABLE `session` DROP FOREIGN KEY `Session_userId_fkey`;

-- AlterTable
ALTER TABLE `dtrentry` ADD COLUMN `includeBreak` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `supervisor`,
    ADD COLUMN `companyLat` DOUBLE NULL,
    ADD COLUMN `companyLng` DOUBLE NULL,
    ADD COLUMN `role` ENUM('TRAINEE', 'SUPERVISOR', 'ADMIN') NOT NULL DEFAULT 'TRAINEE',
    ADD COLUMN `supervisorId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `invitation` (
    `id` VARCHAR(191) NOT NULL,
    `traineeId` VARCHAR(191) NOT NULL,
    `supervisorEmail` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING',
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `invitation_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user` ADD CONSTRAINT `user_supervisorId_fkey` FOREIGN KEY (`supervisorId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dtrrecord` ADD CONSTRAINT `dtrrecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dtrentry` ADD CONSTRAINT `dtrentry_dtrRecordId_fkey` FOREIGN KEY (`dtrRecordId`) REFERENCES `dtrrecord`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitation` ADD CONSTRAINT `invitation_traineeId_fkey` FOREIGN KEY (`traineeId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RedefineIndex
CREATE UNIQUE INDEX `account_provider_providerAccountId_key` ON `account`(`provider`, `providerAccountId`);
DROP INDEX `Account_provider_providerAccountId_key` ON `account`;

-- RedefineIndex
CREATE UNIQUE INDEX `dtrentry_dtrRecordId_day_key` ON `dtrentry`(`dtrRecordId`, `day`);
DROP INDEX `DTREntry_dtrRecordId_day_key` ON `dtrentry`;

-- RedefineIndex
CREATE UNIQUE INDEX `dtrrecord_userId_month_year_key` ON `dtrrecord`(`userId`, `month`, `year`);
DROP INDEX `DTRRecord_userId_month_year_key` ON `dtrrecord`;

-- RedefineIndex
CREATE UNIQUE INDEX `session_sessionToken_key` ON `session`(`sessionToken`);
DROP INDEX `Session_sessionToken_key` ON `session`;

-- RedefineIndex
CREATE UNIQUE INDEX `user_email_key` ON `user`(`email`);
DROP INDEX `User_email_key` ON `user`;

-- RedefineIndex
CREATE UNIQUE INDEX `verificationtoken_identifier_token_key` ON `verificationtoken`(`identifier`, `token`);
DROP INDEX `VerificationToken_identifier_token_key` ON `verificationtoken`;

-- RedefineIndex
CREATE UNIQUE INDEX `verificationtoken_token_key` ON `verificationtoken`(`token`);
DROP INDEX `VerificationToken_token_key` ON `verificationtoken`;
