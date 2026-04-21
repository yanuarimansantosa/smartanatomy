CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" varchar(200),
	"actor_label" varchar(200),
	"action" varchar(60) NOT NULL,
	"entity" varchar(60) NOT NULL,
	"entity_id" uuid,
	"before_json" jsonb,
	"after_json" jsonb,
	"ip_address" varchar(64),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
-- ============================================================
-- Immutability — PRD prinsip #6 Accountability + brand HARD RULE.
-- Block UPDATE/DELETE from any role. App role only INSERTs.
-- DBA can disable triggers temporarily for legal-mandated redaction only.
-- ============================================================
CREATE OR REPLACE FUNCTION audit_logs_block_mutate() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only — UPDATE/DELETE not permitted (TG_OP=%)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER audit_logs_block_update
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutate();
--> statement-breakpoint
CREATE TRIGGER audit_logs_block_delete
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutate();