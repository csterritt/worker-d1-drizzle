CREATE TABLE `interestedEmails` (
	`email` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interestedEmails_email_unique` ON `interestedEmails` (`email`);