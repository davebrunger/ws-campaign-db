CREATE TABLE `__new_edge` (
	`fromId` integer NOT NULL,
	`toId` integer NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`fromId`, `toId`),
	FOREIGN KEY (`fromId`) REFERENCES `node`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toId`) REFERENCES `node`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_edge`(`fromId`, `toId`, `type`)
SELECT `fromId`, `toId`, ''
FROM `edge`;
--> statement-breakpoint
DROP TABLE `edge`;
--> statement-breakpoint
ALTER TABLE `__new_edge` RENAME TO `edge`;