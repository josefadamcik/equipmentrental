/*
  Warnings:

  - Added the required column `description` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseDate` to the `Equipment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dailyRateAmount" REAL NOT NULL,
    "dailyRateCurrency" TEXT NOT NULL DEFAULT 'USD',
    "condition" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "currentRentalId" TEXT,
    "purchaseDate" DATETIME NOT NULL,
    "lastMaintenanceDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Equipment" ("category", "condition", "createdAt", "currentRentalId", "dailyRateAmount", "dailyRateCurrency", "id", "isAvailable", "lastMaintenanceDate", "name", "updatedAt") SELECT "category", "condition", "createdAt", "currentRentalId", "dailyRateAmount", "dailyRateCurrency", "id", "isAvailable", "lastMaintenanceDate", "name", "updatedAt" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");
CREATE INDEX "Equipment_isAvailable_idx" ON "Equipment"("isAvailable");
CREATE INDEX "Equipment_condition_idx" ON "Equipment"("condition");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
