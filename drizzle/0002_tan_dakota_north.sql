CREATE TABLE `__new_node` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_node`(`id`, `type`, `name`, `summary`)
SELECT `id`, `type`, `name`, ''
FROM `node`;
--> statement-breakpoint
DROP TABLE `node`;
--> statement-breakpoint
ALTER TABLE `__new_node` RENAME TO `node`;
--> statement-breakpoint
CREATE UNIQUE INDEX `node_ux` ON `node` (`name`,`type`);