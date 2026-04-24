-- Einmal-Token für Passwort-Zurücksetzen (Link per E-Mail).
CREATE TABLE "password_reset_challenges" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_digest" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_challenges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_challenges_token_digest_key" ON "password_reset_challenges"("token_digest");

CREATE INDEX "password_reset_challenges_tenant_user_idx" ON "password_reset_challenges"("tenant_id", "user_id");

ALTER TABLE "password_reset_challenges"
ADD CONSTRAINT "password_reset_challenges_user_fk"
FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE CASCADE ON UPDATE RESTRICT;
