/*
  Warnings:

  - You are about to drop the column `buyerName` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `calculatedItemValueUsd` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `customsOfficeCode` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `customsOfficeName` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `destinationIso` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `destinationName` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `exporterName` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `gtipCode` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `gtipDescription` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `incoterm` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `incotermCode` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceAmount` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceCurrency` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `invoiceNo` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `itemDescription` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `itemSequenceNo` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `measureAmount` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `netUnitPrice` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `netWeightKg` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `originIso` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `originName` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `shipperOrReceiverName` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `statisticalValueUsd` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `statusDescription` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `taxNo` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `tescilDate` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `tescilNo` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `tradeDescription31` on the `upload_rows` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `upload_rows` table. All the data in the column will be lost.
  - Added the required column `columns` to the `upload_rows` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."upload_rows_destinationIso_idx";

-- DropIndex
DROP INDEX "public"."upload_rows_gtipCode_idx";

-- DropIndex
DROP INDEX "public"."upload_rows_originIso_idx";

-- DropIndex
DROP INDEX "public"."upload_rows_tescilDate_idx";

-- AlterTable
ALTER TABLE "upload_rows" DROP COLUMN "buyerName",
DROP COLUMN "calculatedItemValueUsd",
DROP COLUMN "customsOfficeCode",
DROP COLUMN "customsOfficeName",
DROP COLUMN "destinationIso",
DROP COLUMN "destinationName",
DROP COLUMN "exporterName",
DROP COLUMN "gtipCode",
DROP COLUMN "gtipDescription",
DROP COLUMN "incoterm",
DROP COLUMN "incotermCode",
DROP COLUMN "invoiceAmount",
DROP COLUMN "invoiceCurrency",
DROP COLUMN "invoiceNo",
DROP COLUMN "itemDescription",
DROP COLUMN "itemSequenceNo",
DROP COLUMN "measureAmount",
DROP COLUMN "netUnitPrice",
DROP COLUMN "netWeightKg",
DROP COLUMN "originIso",
DROP COLUMN "originName",
DROP COLUMN "quantity",
DROP COLUMN "shipperOrReceiverName",
DROP COLUMN "statisticalValueUsd",
DROP COLUMN "statusDescription",
DROP COLUMN "taxNo",
DROP COLUMN "tescilDate",
DROP COLUMN "tescilNo",
DROP COLUMN "tradeDescription31",
DROP COLUMN "unit",
ADD COLUMN     "columns" JSONB NOT NULL;
