CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`unit` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `items_name_unique` ON `items` (`name`);--> statement-breakpoint
CREATE TABLE `shipment_items` (
	`id` text PRIMARY KEY NOT NULL,
	`shipment_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quantity` real NOT NULL,
	FOREIGN KEY (`shipment_id`) REFERENCES `shipments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `shipment_items_shipment_idx` ON `shipment_items` (`shipment_id`);--> statement-breakpoint
CREATE INDEX `shipment_items_item_idx` ON `shipment_items` (`item_id`);--> statement-breakpoint
CREATE TABLE `stock_movements` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`type` text NOT NULL,
	`quantity` real NOT NULL,
	`note` text,
	`recorded_by` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recorded_by`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_movements_item_idx` ON `stock_movements` (`item_id`);