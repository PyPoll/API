/*
  Warnings:

  - Added the required column `filename` to the `Media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Poll` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `media` ADD COLUMN `filename` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `poll` ADD COLUMN `type` VARCHAR(191) NOT NULL;
