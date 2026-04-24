-- Auth: mandanten-isolierte Benutzer für Passwort-Login (Multi-User pro Mandant).
CREATE TABLE "users" (
    "tenant_id" UUID NOT NULL,
    "id" UUID NOT NULL,
    "email_norm" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("tenant_id", "id")
);

CREATE UNIQUE INDEX "users_tenant_id_email_norm_key" ON "users"("tenant_id", "email_norm");
