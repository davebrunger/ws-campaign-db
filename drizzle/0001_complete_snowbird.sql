CREATE TABLE `node` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `node_ux` ON `node` (`name`,`type`);--> statement-breakpoint
CREATE TABLE `edge` (
	`fromId` integer NOT NULL,
	`toId` integer NOT NULL,
	PRIMARY KEY(`fromId`, `toId`),
	FOREIGN KEY (`fromId`) REFERENCES `node`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toId`) REFERENCES `node`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tag` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tag_name_unique` ON `tag` (`name`);CREATE TABLE `nodeTag` (
	`nodeId` integer NOT NULL,
	`tagId` integer NOT NULL,
	PRIMARY KEY(`nodeId`, `tagId`),
	FOREIGN KEY (`nodeId`) REFERENCES `node`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tagId`) REFERENCES `tag`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
