-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('SCHEDULED', 'CLOSED', 'DRAWN', 'CANCELLED', 'DISABLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ParticipationStatus" AS ENUM ('CONFIRMED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PrizeStatus" AS ENUM ('PENDING', 'CONTACTED', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACCOUNT_CREATED', 'PASSWORD_RESET', 'PARTICIPATION_CONFIRMED', 'DRAW_REMINDER', 'DRAW_RESULT', 'DRAW_WON', 'DRAW_CANCELLED', 'PRIZE_DELIVERY');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "birthDate" DATE,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "shortDescription" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "purchaseCost" INTEGER NOT NULL,
    "displayValue" INTEGER NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draws" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "ticketPrice" INTEGER NOT NULL,
    "maxTickets" INTEGER NOT NULL,
    "minTickets" INTEGER,
    "soldTickets" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "DrawStatus" NOT NULL DEFAULT 'SCHEDULED',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "seedHash" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "closedAt" TIMESTAMP(3),
    "drawnAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "prizeStatus" "PrizeStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "draws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "cardBrand" TEXT,
    "cardLast4" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT true,
    "failureReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "status" "ParticipationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "participationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "winners" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "ticketCount" INTEGER NOT NULL,
    "winningIndex" INTEGER NOT NULL,
    "ticketsDigest" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "seedHash" TEXT NOT NULL,
    "previousHash" TEXT NOT NULL,
    "resultHash" TEXT NOT NULL,
    "drawnAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "winners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "drawId" TEXT,
    "toEmail" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "transport" TEXT NOT NULL,
    "error" TEXT,
    "readAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorLabel" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_reference_key" ON "products"("reference");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "product_images_productId_idx" ON "product_images"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "draws_number_key" ON "draws"("number");

-- CreateIndex
CREATE INDEX "draws_status_endsAt_idx" ON "draws"("status", "endsAt");

-- CreateIndex
CREATE INDEX "draws_productId_idx" ON "draws"("productId");

-- CreateIndex

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "participations_paymentId_key" ON "participations"("paymentId");

-- CreateIndex
CREATE INDEX "participations_userId_idx" ON "participations"("userId");

-- CreateIndex
CREATE INDEX "participations_drawId_idx" ON "participations"("drawId");

-- CreateIndex
CREATE INDEX "tickets_userId_idx" ON "tickets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_drawId_number_key" ON "tickets"("drawId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "winners_drawId_key" ON "winners"("drawId");

-- CreateIndex
CREATE UNIQUE INDEX "winners_ticketId_key" ON "winners"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "winners_resultHash_key" ON "winners"("resultHash");

-- CreateIndex
CREATE INDEX "winners_drawnAt_idx" ON "winners"("drawnAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_logs_createdAt_idx" ON "admin_logs"("createdAt");

-- CreateIndex
CREATE INDEX "admin_logs_entityType_entityId_idx" ON "admin_logs"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draws" ADD CONSTRAINT "draws_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participations" ADD CONSTRAINT "participations_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_participationId_fkey" FOREIGN KEY ("participationId") REFERENCES "participations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "winners" ADD CONSTRAINT "winners_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "draws"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================================
-- Intégrité des tirages (garde-fous au niveau base de données)
-- ============================================================================

-- 1. Les résultats (winners) sont en écriture unique : ni UPDATE, ni DELETE.
CREATE OR REPLACE FUNCTION winners_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Les résultats de tirage sont immuables (opération % interdite)', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER winners_no_update BEFORE UPDATE OR DELETE ON "winners"
  FOR EACH ROW EXECUTE FUNCTION winners_immutable();

-- 2. Un ticket ne peut être créé que pour un tirage ouvert (dans sa fenêtre de dates),
--    et ne peut plus être modifié/supprimé une fois le tirage clôturé.
CREATE OR REPLACE FUNCTION tickets_guard() RETURNS trigger AS $$
DECLARE d RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT status, "startsAt" AS starts_at, "endsAt" AS ends_at, "maxTickets" AS max_tickets INTO d FROM "draws" WHERE id = NEW."drawId";
    IF d.status <> 'SCHEDULED' OR now() < d.starts_at OR now() >= d.ends_at THEN
      RAISE EXCEPTION 'Tirage fermé : impossible de créer un ticket';
    END IF;
    IF NEW.number < 1 OR NEW.number > d.max_tickets THEN
      RAISE EXCEPTION 'Numéro de ticket hors limites';
    END IF;
    RETURN NEW;
  END IF;
  SELECT status INTO d FROM "draws" WHERE id = OLD."drawId";
  IF d.status IN ('CLOSED', 'DRAWN') THEN
    RAISE EXCEPTION 'Tirage verrouillé : tickets non modifiables';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tickets_guard_trg BEFORE INSERT OR UPDATE OR DELETE ON "tickets"
  FOR EACH ROW EXECUTE FUNCTION tickets_guard();

-- 3. L'engagement ("seedHash") ne change jamais, et un tirage DRAWN ne peut plus évoluer
--    (seul le suivi de livraison du lot reste modifiable).
CREATE OR REPLACE FUNCTION draws_guard() RETURNS trigger AS $$
BEGIN
  IF NEW."seedHash" <> OLD."seedHash" OR NEW."serverSeed" <> OLD."serverSeed" THEN
    RAISE EXCEPTION 'La graine d''un tirage est immuable';
  END IF;
  IF OLD.status = 'DRAWN' AND (
       NEW.status <> 'DRAWN' OR NEW."soldTickets" <> OLD."soldTickets"
       OR NEW."endsAt" <> OLD."endsAt" OR NEW."maxTickets" <> OLD."maxTickets"
       OR NEW."ticketPrice" <> OLD."ticketPrice" OR NEW."drawnAt" IS DISTINCT FROM OLD."drawnAt") THEN
    RAISE EXCEPTION 'Tirage déjà effectué : modification interdite';
  END IF;
  IF OLD.status IN ('CLOSED', 'CANCELLED') AND NEW.status = 'SCHEDULED' THEN
    RAISE EXCEPTION 'Un tirage clôturé ne peut pas être rouvert';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER draws_guard_trg BEFORE UPDATE ON "draws"
  FOR EACH ROW EXECUTE FUNCTION draws_guard();

CREATE TRIGGER draws_no_delete_drawn BEFORE DELETE ON "draws"
  FOR EACH ROW WHEN (OLD.status IN ('CLOSED', 'DRAWN')) EXECUTE FUNCTION winners_immutable();
