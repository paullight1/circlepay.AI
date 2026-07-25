CREATE TYPE "public"."agent_kind" AS ENUM('kiosk', 'store', 'agent');--> statement-breakpoint
CREATE TYPE "public"."campaign_category" AS ENUM('Burial', 'Birthday', 'Medical', 'Wedding', 'School Fees', 'Community');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."circle_status" AS ENUM('active', 'completed', 'pending');--> statement-breakpoint
CREATE TYPE "public"."donation_method" AS ENUM('wallet', 'transfer', 'ussd', 'agent');--> statement-breakpoint
CREATE TYPE "public"."frequency" AS ENUM('daily', 'weekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."installment_status" AS ENUM('paid', 'upcoming', 'pending');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('paid', 'pending', 'late');--> statement-breakpoint
CREATE TYPE "public"."notif_type" AS ENUM('alert', 'payment', 'payout', 'backup', 'campaign', 'system');--> statement-breakpoint
CREATE TYPE "public"."pay_category" AS ENUM('Rent', 'School Fees', 'Medical Bills', 'Consumer Products', 'Business Services', 'Other');--> statement-breakpoint
CREATE TYPE "public"."pay_model" AS ENUM('gradual', 'upfront');--> statement-breakpoint
CREATE TYPE "public"."plan_status" AS ENUM('active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'moderate', 'high');--> statement-breakpoint
CREATE TYPE "public"."tx_category" AS ENUM('circle', 'wallet', 'partpay', 'campaign', 'agent', 'fee');--> statement-breakpoint
CREATE TYPE "public"."tx_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TYPE "public"."tx_status" AS ENUM('success', 'pending', 'failed', 'deducted');--> statement-breakpoint
CREATE TYPE "public"."withdrawal_status" AS ENUM('pending', 'completed', 'expired');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"distance_km" numeric(6, 2) NOT NULL,
	"open" boolean DEFAULT true NOT NULL,
	"kind" "agent_kind" NOT NULL,
	"agent_code" text NOT NULL,
	CONSTRAINT "agents_agent_code_unique" UNIQUE("agent_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"code" text NOT NULL,
	"title" text NOT NULL,
	"organizer" text NOT NULL,
	"category" "campaign_category" NOT NULL,
	"target" numeric(14, 2) NOT NULL,
	"raised" numeric(14, 2) DEFAULT '0' NOT NULL,
	"supporters" integer DEFAULT 0 NOT NULL,
	"deadline" timestamp with time zone NOT NULL,
	"about" text NOT NULL,
	"status" "campaign_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaigns_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "circle_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"circle_id" uuid NOT NULL,
	"user_id" uuid,
	"name" text NOT NULL,
	"status" "member_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"is_you" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"risk_level" "risk_level" DEFAULT 'low',
	"risk_score" integer DEFAULT 10
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "circles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"frequency" "frequency" NOT NULL,
	"amount_per_member" numeric(14, 2) NOT NULL,
	"current_cycle" integer DEFAULT 1 NOT NULL,
	"next_payout_date" timestamp with time zone NOT NULL,
	"backup_pool_pct" integer DEFAULT 10 NOT NULL,
	"backup_pool_balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" "circle_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"donor_user_id" uuid,
	"donor" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"method" "donation_method" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"status" "installment_status" DEFAULT 'pending' NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "linked_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"bank" text NOT NULL,
	"last4" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"purpose" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notif_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "part_pay_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"detail" text,
	"category" "pay_category" NOT NULL,
	"model" "pay_model" NOT NULL,
	"total_amount" numeric(14, 2) NOT NULL,
	"initial_payment" numeric(14, 2) NOT NULL,
	"installment_amount" numeric(14, 2) NOT NULL,
	"frequency" "frequency" DEFAULT 'monthly' NOT NULL,
	"duration_months" integer NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"service_fee_pct" integer DEFAULT 0 NOT NULL,
	"status" "plan_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scratch_card_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"serial" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scratch_card_redemptions_serial_unique" UNIQUE("serial")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"amount" numeric(14, 2) NOT NULL,
	"direction" "tx_direction" NOT NULL,
	"status" "tx_status" DEFAULT 'success' NOT NULL,
	"category" "tx_category" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trust_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text NOT NULL,
	"detail" text NOT NULL,
	"positive" boolean NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"first_name" text NOT NULL,
	"phone" text NOT NULL,
	"circle_pay_id" text NOT NULL,
	"kyc_tier" integer DEFAULT 0 NOT NULL,
	"pin_hash" text,
	"pin_set" boolean DEFAULT false NOT NULL,
	"biometrics_enabled" boolean DEFAULT false NOT NULL,
	"onboarded" boolean DEFAULT false NOT NULL,
	"trust_score" integer DEFAULT 720 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "users_circle_pay_id_unique" UNIQUE("circle_pay_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wallets" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"available" numeric(14, 2) DEFAULT '0' NOT NULL,
	"savings" numeric(14, 2) DEFAULT '0' NOT NULL,
	"on_hold" numeric(14, 2) DEFAULT '0' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "withdrawal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"fee" numeric(14, 2) NOT NULL,
	"status" "withdrawal_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "circle_members" ADD CONSTRAINT "circle_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "circles" ADD CONSTRAINT "circles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donations" ADD CONSTRAINT "donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "donations" ADD CONSTRAINT "donations_donor_user_id_users_id_fk" FOREIGN KEY ("donor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "installments" ADD CONSTRAINT "installments_plan_id_part_pay_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."part_pay_plans"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "part_pay_plans" ADD CONSTRAINT "part_pay_plans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scratch_card_redemptions" ADD CONSTRAINT "scratch_card_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trust_signals" ADD CONSTRAINT "trust_signals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "withdrawal_requests" ADD CONSTRAINT "withdrawal_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "circle_member_circle_idx" ON "circle_members" USING btree ("circle_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "donation_campaign_idx" ON "donations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "installment_plan_idx" ON "installments" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notif_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_phone_idx" ON "otp_codes" USING btree ("phone");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tx_user_created_idx" ON "transactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "withdrawal_user_idx" ON "withdrawal_requests" USING btree ("user_id");