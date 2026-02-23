PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_edge` (
	`fromId` integer NOT NULL,
	`toId` integer NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`fromId`, `toId`),
	FOREIGN KEY (`fromId`) REFERENCES `node`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`toId`) REFERENCES `node`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "edge_type_non_empty" CHECK(length("__new_edge"."type") > 0)
);
--> statement-breakpoint
INSERT INTO `__new_edge`("fromId", "toId", "type")
SELECT "fromId", "toId", CASE WHEN length(trim("type")) = 0 THEN 'unspecified' ELSE "type" END
FROM `edge`;--> statement-breakpoint
DROP TABLE `edge`;--> statement-breakpoint
ALTER TABLE `__new_edge` RENAME TO `edge`;--> statement-breakpoint
PRAGMA foreign_keys=ON;