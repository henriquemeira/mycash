CREATE TABLE `reminder_notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`transaction_id` text NOT NULL,
	`user_id` text NOT NULL,
	`sent_at` integer NOT NULL,
	FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reminder_notifications_tx_idx` ON `reminder_notifications` (`transaction_id`);--> statement-breakpoint
CREATE INDEX `reminder_notifications_user_idx` ON `reminder_notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `transactions_reminder_idx` ON `transactions` (`reminder_date`,`deleted_at`);