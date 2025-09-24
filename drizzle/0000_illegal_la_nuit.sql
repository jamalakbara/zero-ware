CREATE TABLE `account` (
	`id` varchar(255) NOT NULL,
	`account_id` varchar(255) NOT NULL,
	`provider_id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`access_token` varchar(500),
	`refresh_token` varchar(500),
	`id_token` varchar(500),
	`access_token_expires_at` timestamp,
	`refresh_token_expires_at` timestamp,
	`scope` varchar(255),
	`password` varchar(255),
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `account_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	`ip_address` varchar(45),
	`user_agent` varchar(500),
	`user_id` varchar(255) NOT NULL,
	CONSTRAINT `session_id` PRIMARY KEY(`id`),
	CONSTRAINT `session_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_verified` boolean NOT NULL,
	`image` varchar(255),
	`created_at` timestamp NOT NULL,
	`updated_at` timestamp NOT NULL,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` varchar(255) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` varchar(255) NOT NULL,
	`expires_at` timestamp NOT NULL,
	`created_at` timestamp,
	`updated_at` timestamp,
	CONSTRAINT `verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ct_data` (
	`id` varchar(36) NOT NULL,
	`study_id` varchar(36) NOT NULL,
	`date` timestamp NOT NULL,
	`shift` varchar(1) NOT NULL,
	`cycle_time` decimal(10,2) NOT NULL,
	`target_cycle_time` decimal(10,2) NOT NULL,
	`efficiency` decimal(5,2),
	`operator` varchar(100),
	`notes` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ct_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `piece_counters` (
	`id` varchar(36) NOT NULL,
	`study_id` varchar(36) NOT NULL,
	`date` timestamp NOT NULL,
	`shift` varchar(1) NOT NULL,
	`good_pieces` int NOT NULL DEFAULT 0,
	`defect_pieces` int NOT NULL DEFAULT 0,
	`rework_pieces` int NOT NULL DEFAULT 0,
	`scrap_pieces` int NOT NULL DEFAULT 0,
	`target_pieces` int NOT NULL,
	`operator` varchar(100),
	`notes` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `piece_counters_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `s1_data` (
	`id` varchar(36) NOT NULL,
	`study_id` varchar(36) NOT NULL,
	`date` timestamp NOT NULL,
	`shift` varchar(1) NOT NULL,
	`loss_category` varchar(100) NOT NULL,
	`loss_reason` varchar(255) NOT NULL,
	`duration` int NOT NULL,
	`impact` varchar(10) DEFAULT 'medium',
	`notes` varchar(1000),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `s1_data_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studies` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` varchar(1000),
	`product` varchar(255) NOT NULL,
	`machine` varchar(255) NOT NULL,
	`duration` int NOT NULL,
	`start_date` timestamp NOT NULL,
	`end_date` timestamp NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'preparation',
	`created_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_participants` (
	`id` varchar(36) NOT NULL,
	`study_id` varchar(36) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`role` varchar(10) NOT NULL DEFAULT 'viewer',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `study_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `study_reports` (
	`id` varchar(36) NOT NULL,
	`study_id` varchar(36) NOT NULL,
	`report_type` varchar(20) NOT NULL,
	`file_name` varchar(255) NOT NULL,
	`file_path` varchar(500),
	`format` varchar(10) NOT NULL,
	`parameters` varchar(2000),
	`generated_by` varchar(255) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `study_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `account` ADD CONSTRAINT `account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `session` ADD CONSTRAINT `session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ct_data` ADD CONSTRAINT `ct_data_study_id_studies_id_fk` FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `piece_counters` ADD CONSTRAINT `piece_counters_study_id_studies_id_fk` FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `s1_data` ADD CONSTRAINT `s1_data_study_id_studies_id_fk` FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studies` ADD CONSTRAINT `studies_created_by_user_id_fk` FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `study_participants` ADD CONSTRAINT `study_participants_study_id_studies_id_fk` FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `study_participants` ADD CONSTRAINT `study_participants_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `study_reports` ADD CONSTRAINT `study_reports_study_id_studies_id_fk` FOREIGN KEY (`study_id`) REFERENCES `studies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `study_reports` ADD CONSTRAINT `study_reports_generated_by_user_id_fk` FOREIGN KEY (`generated_by`) REFERENCES `user`(`id`) ON DELETE no action ON UPDATE no action;