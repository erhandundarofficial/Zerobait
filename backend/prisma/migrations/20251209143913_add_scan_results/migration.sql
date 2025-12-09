-- CreateTable
CREATE TABLE "scan_results" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scan_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "scan_results_url_key" ON "scan_results"("url");
