/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Centralized database access layer with retry logic and Result types
 * @module lib/db-access
 */
import retry from 'async-retry'
import Result from 'true-myth/result'
import { eq } from 'drizzle-orm'

import { user, account, singleUseCode, interestedEmails } from '../db/schema'
import { STANDARD_RETRY_OPTIONS } from '../constants'
import type { DrizzleClient } from '../local-types'

/**
 * Type definitions for database operations
 */
export interface UserWithAccountData {
  userId: string
  userName: string | null
  userEmail: string
  emailVerified: boolean
  accountUpdatedAt: Date | null
}

export interface UserIdData {
  id: string
}

/**
 * Wrap a database operation with retry logic and Result type handling
 * @param operationName - Name of the operation for logging
 * @param operation - The async operation to execute
 * @returns Promise<Result<T, Error>>
 */
const withRetry = async <T>(
  operationName: string,
  operation: () => Promise<Result<T, Error>>
): Promise<Result<T, Error>> => {
  try {
    return await retry(operation, STANDARD_RETRY_OPTIONS)
  } catch (err) {
    console.log(`${operationName} final error:`, err)
    return Result.err(err instanceof Error ? err : new Error(String(err)))
  }
}

/**
 * Wrap a value in Result.ok, or wrap an error in Result.err
 * @param fn - The async function to execute
 * @returns Promise<Result<T, Error>>
 */
const toResult = async <T>(fn: () => Promise<T>): Promise<Result<T, Error>> => {
  try {
    return Result.ok(await fn())
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Get user with account data for rate limiting checks
 * @param db - Database instance
 * @param email - User email to look up
 * @returns Promise<Result<UserWithAccountData[], Error>>
 */
export const getUserWithAccountByEmail = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserWithAccountData[], Error>> =>
  withRetry('getUserWithAccountByEmail', () =>
    getUserWithAccountByEmailActual(db, email)
  )

const getUserWithAccountByEmailActual = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserWithAccountData[], Error>> =>
  toResult(() =>
    db
      .select({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        emailVerified: user.emailVerified,
        accountUpdatedAt: account.updatedAt,
      })
      .from(user)
      .leftJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email))
      .limit(1)
  )

/**
 * Find user by email and return user ID
 * @param db - Database instance
 * @param email - User email to look up
 * @returns Promise<Result<UserIdData[], Error>>
 */
export const getUserIdByEmail = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserIdData[], Error>> =>
  withRetry('getUserIdByEmail', () => getUserIdByEmailActual(db, email))

const getUserIdByEmailActual = (
  db: DrizzleClient,
  email: string
): Promise<Result<UserIdData[], Error>> =>
  toResult(() =>
    db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1)
  )

/**
 * Update account timestamp for rate limiting
 * @param db - Database instance
 * @param userId - User ID whose account to update
 * @returns Promise<Result<boolean, Error>>
 */
export const updateAccountTimestamp = (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> =>
  withRetry('updateAccountTimestamp', () =>
    updateAccountTimestampActual(db, userId)
  )

const updateAccountTimestampActual = async (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> => {
  try {
    await db
      .update(account)
      .set({ updatedAt: new Date() })
      .where(eq(account.userId, userId))
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Validate a single-use code exists (without consuming it)
 * @param db - Database instance
 * @param code - The code to validate
 * @returns Promise<Result<boolean, Error>> - true if code exists, false if not
 */
export const validateSingleUseCode = (
  db: DrizzleClient,
  code: string
): Promise<Result<boolean, Error>> =>
  withRetry('validateSingleUseCode', () =>
    validateSingleUseCodeActual(db, code)
  )

const validateSingleUseCodeActual = async (
  db: DrizzleClient,
  code: string
): Promise<Result<boolean, Error>> => {
  try {
    const result = await db
      .select({ code: singleUseCode.code })
      .from(singleUseCode)
      .where(eq(singleUseCode.code, code))
    return Result.ok(result.length === 1)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Consume a single-use code (delete it from the database)
 * @param db - Database instance
 * @param code - The code to consume
 * @returns Promise<Result<boolean, Error>> - true if code existed and was consumed, false if code didn't exist
 */
export const consumeSingleUseCode = (
  db: DrizzleClient,
  code: string
): Promise<Result<boolean, Error>> =>
  withRetry('consumeSingleUseCode', () => consumeSingleUseCodeActual(db, code))

const consumeSingleUseCodeActual = async (
  db: DrizzleClient,
  code: string
): Promise<Result<boolean, Error>> => {
  try {
    const result = await db
      .delete(singleUseCode)
      .where(eq(singleUseCode.code, code))
    const rowsDeleted = result.meta?.changes || 0
    return Result.ok(rowsDeleted === 1)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Add an email to the interested emails list
 * @param db - Database instance
 * @param email - Email address to add
 * @returns Promise<Result<boolean, Error>> - true if added successfully, false if already exists
 */
export const addInterestedEmail = (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> =>
  withRetry('addInterestedEmail', () => addInterestedEmailActual(db, email))

/**
 * Check if an email is already in the interested emails list
 * @param db - Database instance
 * @param email - Email address to check
 * @returns Promise<Result<boolean, Error>> - true if email exists, false otherwise
 */
export const checkInterestedEmailExists = (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> =>
  withRetry('checkInterestedEmailExists', () =>
    checkInterestedEmailExistsActual(db, email)
  )

const addInterestedEmailActual = async (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> => {
  try {
    const existingEmails = await db
      .select()
      .from(interestedEmails)
      .where(eq(interestedEmails.email, email))

    if (existingEmails.length > 0) {
      return Result.ok(false)
    }

    await db.insert(interestedEmails).values({ email })
    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

const checkInterestedEmailExistsActual = async (
  db: DrizzleClient,
  email: string
): Promise<Result<boolean, Error>> => {
  try {
    const existingEmails = await db
      .select()
      .from(interestedEmails)
      .where(eq(interestedEmails.email, email))
    return Result.ok(existingEmails.length > 0)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Delete a user account by user ID
 * FK cascade will automatically delete associated sessions and accounts
 * @param db - Database instance
 * @param userId - User ID to delete
 * @returns Promise<Result<boolean, Error>> - true if user was deleted
 */
export const deleteUserAccount = (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> =>
  withRetry('deleteUserAccount', () => deleteUserAccountActual(db, userId))

const deleteUserAccountActual = async (
  db: DrizzleClient,
  userId: string
): Promise<Result<boolean, Error>> => {
  try {
    const result = await db.delete(user).where(eq(user.id, userId))
    // D1 returns changes in meta.changes, but fallback to rowsAffected for compatibility
    const rowsDeleted =
      result.meta?.changes ??
      (result as { rowsAffected?: number }).rowsAffected ??
      0
    return Result.ok(rowsDeleted >= 1)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}
