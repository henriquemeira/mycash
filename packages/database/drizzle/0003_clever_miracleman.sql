ALTER TABLE `transactions` ADD `recurrence_id` text;--> statement-breakpoint
ALTER TABLE `transactions` ADD `installment_number` integer;--> statement-breakpoint
ALTER TABLE `transactions` ADD `total_installments` integer;--> statement-breakpoint
ALTER TABLE `transactions` ADD `notes` text;--> statement-breakpoint
CREATE INDEX `transactions_recurrence_idx` ON `transactions` (`recurrence_id`);