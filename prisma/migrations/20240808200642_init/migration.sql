/*
  Warnings:

  - The primary key for the `pollanswer` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `pollanswer` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`pollId`, `userId`, `answerId`);
