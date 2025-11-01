-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "fileHash" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "upload_rows" (
    "id" TEXT NOT NULL,
    "uploadId" TEXT NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "customsOfficeCode" TEXT,
    "customsOfficeName" TEXT,
    "tescilNo" TEXT,
    "tescilDate" TIMESTAMP(3),
    "invoiceNo" TEXT,
    "exporterName" TEXT,
    "buyerName" TEXT,
    "destinationIso" TEXT,
    "destinationName" TEXT,
    "originIso" TEXT,
    "originName" TEXT,
    "incoterm" TEXT,
    "gtipCode" TEXT,
    "itemDescription" TEXT,
    "invoiceCurrency" TEXT,
    "invoiceAmount" DECIMAL(20,4),
    "netUnitPrice" DECIMAL(20,4),
    "quantity" DECIMAL(20,4),
    "unit" TEXT,
    "raw" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "upload_rows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uploads_fileHash_key" ON "uploads"("fileHash");

-- CreateIndex
CREATE INDEX "upload_rows_gtipCode_idx" ON "upload_rows"("gtipCode");

-- CreateIndex
CREATE INDEX "upload_rows_destinationIso_idx" ON "upload_rows"("destinationIso");

-- CreateIndex
CREATE INDEX "upload_rows_originIso_idx" ON "upload_rows"("originIso");

-- CreateIndex
CREATE INDEX "upload_rows_tescilDate_idx" ON "upload_rows"("tescilDate");

-- CreateIndex
CREATE UNIQUE INDEX "upload_rows_uploadId_rowIndex_key" ON "upload_rows"("uploadId", "rowIndex");

-- AddForeignKey
ALTER TABLE "upload_rows" ADD CONSTRAINT "upload_rows_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
