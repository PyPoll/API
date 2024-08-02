/*
  Warnings:

  - Added the required column `description` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `poll` ADD COLUMN `description` VARCHAR(191) NOT NULL;
