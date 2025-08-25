CREATE TABLE `singleUseCode` (
	`code` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `singleUseCode_code_unique` ON `singleUseCode` (`code`);