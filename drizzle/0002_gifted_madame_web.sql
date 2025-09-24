ALTER TABLE `account` MODIFY COLUMN `access_token_expires_at` datetime;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `refresh_token_expires_at` datetime;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `account` MODIFY COLUMN `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `expires_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `session` MODIFY COLUMN `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `email_verified` boolean NOT NULL DEFAULT false;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `user` MODIFY COLUMN `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `expires_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `created_at` datetime;--> statement-breakpoint
ALTER TABLE `verification` MODIFY COLUMN `updated_at` datetime;--> statement-breakpoint
ALTER TABLE `ct_data` MODIFY COLUMN `date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `ct_data` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `ct_data` MODIFY COLUMN `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `piece_counters` MODIFY COLUMN `date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `piece_counters` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `piece_counters` MODIFY COLUMN `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `s1_data` MODIFY COLUMN `date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `s1_data` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `s1_data` MODIFY COLUMN `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `studies` MODIFY COLUMN `start_date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `studies` MODIFY COLUMN `end_date` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `studies` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `studies` MODIFY COLUMN `updated_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `study_participants` MODIFY COLUMN `created_at` datetime NOT NULL;--> statement-breakpoint
ALTER TABLE `study_reports` MODIFY COLUMN `created_at` datetime NOT NULL;