-- AlterTable
ALTER TABLE "upload_rows" ADD COLUMN     "calculatedItemValueUsd" DECIMAL(20,4),
ADD COLUMN     "gtipDescription" TEXT,
ADD COLUMN     "incotermCode" TEXT,
ADD COLUMN     "itemSequenceNo" INTEGER,
ADD COLUMN     "measureAmount" DECIMAL(20,4),
ADD COLUMN     "netWeightKg" DECIMAL(20,4),
ADD COLUMN     "shipperOrReceiverName" TEXT,
ADD COLUMN     "statisticalValueUsd" DECIMAL(20,4),
ADD COLUMN     "statusDescription" TEXT,
ADD COLUMN     "taxNo" TEXT,
ADD COLUMN     "tradeDescription31" TEXT;
