/*
  Warnings:

  - The required column `id` was added to the `VerificationToken` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateTable
CREATE TABLE "ArenaSeason" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonNumber" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "winnerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ArenaParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "budget" REAL NOT NULL,
    "tickers" TEXT NOT NULL,
    "allocationsJSON" TEXT NOT NULL,
    "entryPricesJSON" TEXT NOT NULL,
    "currentPricesJSON" TEXT NOT NULL,
    "hasPaid" BOOLEAN NOT NULL DEFAULT false,
    "portfolioValue" REAL NOT NULL DEFAULT 0.0,
    "avgReturnPct" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ArenaParticipant_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "ArenaSeason" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ArenaParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ArenaDailyPerformance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "participantId" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "portfolioValue" REAL NOT NULL,
    "avgReturnPct" REAL NOT NULL,
    CONSTRAINT "ArenaDailyPerformance_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "ArenaParticipant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" DATETIME,
    "password" TEXT,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "realBalance" REAL NOT NULL DEFAULT 100.0,
    "arenaTier" TEXT NOT NULL DEFAULT 'Silver',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "plan", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "plan", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_VerificationToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);
INSERT INTO "new_VerificationToken" ("expires", "identifier", "token") SELECT "expires", "identifier", "token" FROM "VerificationToken";
DROP TABLE "VerificationToken";
ALTER TABLE "new_VerificationToken" RENAME TO "VerificationToken";
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ArenaSeason_seasonNumber_key" ON "ArenaSeason"("seasonNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ArenaParticipant_seasonId_userId_key" ON "ArenaParticipant"("seasonId", "userId");
