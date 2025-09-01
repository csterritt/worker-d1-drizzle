CREATE TABLE IF NOT EXISTS `account` (
                                         `id` text PRIMARY KEY NOT NULL,
                                         `userId` text NOT NULL,
                                         `accountId` text NOT NULL,
                                         `providerId` text NOT NULL,
                                         `accessToken` text,
                                         `refreshToken` text,
                                         `accessTokenExpiresAt` integer,
                                         `refreshTokenExpiresAt` integer,
                                         `scope` text,
                                         `idToken` text,
                                         `password` text,
                                         `createdAt` integer NOT NULL,
                                         `updatedAt` integer NOT NULL,
                                         FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
    );
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `session` (
                                         `id` text PRIMARY KEY NOT NULL,
                                         `userId` text NOT NULL,
                                         `token` text NOT NULL,
                                         `expiresAt` integer NOT NULL,
                                         `ipAddress` text,
                                         `userAgent` text,
                                         `createdAt` integer NOT NULL,
                                         `updatedAt` integer NOT NULL,
                                         FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
    );
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `user` (
                                      `id` text PRIMARY KEY NOT NULL,
                                      `name` text,
                                      `email` text NOT NULL,
                                      `emailVerified` integer DEFAULT false NOT NULL,
                                      `image` text,
                                      `createdAt` integer NOT NULL,
                                      `updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `verification` (
                                              `id` text PRIMARY KEY NOT NULL,
                                              `identifier` text NOT NULL,
                                              `value` text NOT NULL,
                                              `expiresAt` integer NOT NULL,
                                              `createdAt` integer NOT NULL,
                                              `updatedAt` integer NOT NULL
);
CREATE TABLE IF NOT EXISTS `singleUseCode` (
                                               `code` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `singleUseCode_code_unique` ON `singleUseCode` (`code`);
CREATE TABLE IF NOT EXISTS `interestedEmails` (
                                                  `email` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `interestedEmails_email_unique` ON `interestedEmails` (`email`);
