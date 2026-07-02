-- CreateTable
CREATE TABLE "virtual_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombaAccountRef" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "bankAccountName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountHolderId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "bvn" TEXT,
    "expired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "virtual_accounts_userId_key" ON "virtual_accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_accounts_nombaAccountRef_key" ON "virtual_accounts"("nombaAccountRef");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_logs_requestId_key" ON "webhook_logs"("requestId");

-- AddForeignKey
ALTER TABLE "virtual_accounts" ADD CONSTRAINT "virtual_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
