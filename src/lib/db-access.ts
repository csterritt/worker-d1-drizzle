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
 * Get user with account data for rate limiting checks
 * @param db - Database instance
 * @param email - User email to look up
 * @returns Promise<Result<UserWithAccountData[], Error>>
 */
export const getUserWithAccountByEmail = async (
  db: any,
  email: string
): Promise<Result<UserWithAccountData[], Error>> => {
  let res: Result<UserWithAccountData[], Error>
  try {
    res = await retry(
      () => getUserWithAccountByEmailActual(db, email),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`getUserWithAccountByEmail final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const getUserWithAccountByEmailActual = async (
  db: any,
  email: string
): Promise<Result<UserWithAccountData[], Error>> => {
  try {
    const userWithAccount = await db
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

    return Result.ok(userWithAccount)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Find user by email and return user ID
 * @param db - Database instance
 * @param email - User email to look up
 * @returns Promise<Result<UserIdData[], Error>>
 */
export const getUserIdByEmail = async (
  db: any,
  email: string
): Promise<Result<UserIdData[], Error>> => {
  let res: Result<UserIdData[], Error>
  try {
    res = await retry(
      () => getUserIdByEmailActual(db, email),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`getUserIdByEmail final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const getUserIdByEmailActual = async (
  db: any,
  email: string
): Promise<Result<UserIdData[], Error>> => {
  try {
    const userData = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    return Result.ok(userData)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Update account timestamp for rate limiting
 * @param db - Database instance
 * @param userId - User ID whose account to update
 * @returns Promise<Result<boolean, Error>>
 */
export const updateAccountTimestamp = async (
  db: any,
  userId: string
): Promise<Result<boolean, Error>> => {
  let res: Result<boolean, Error>
  try {
    res = await retry(
      () => updateAccountTimestampActual(db, userId),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`updateAccountTimestamp final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const updateAccountTimestampActual = async (
  db: any,
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
 * Consume a single-use code (validate and delete atomically)
 * @param db - Database instance
 * @param code - The code to consume
 * @returns Promise<Result<boolean, Error>> - true if code existed and was consumed, false if code didn't exist
 */
export const consumeSingleUseCode = async (
  db: any,
  code: string
): Promise<Result<boolean, Error>> => {
  let res: Result<boolean, Error>
  try {
    res = await retry(
      () => consumeSingleUseCodeActual(db, code),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`consumeSingleUseCode final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const consumeSingleUseCodeActual = async (
  db: any,
  code: string
): Promise<Result<boolean, Error>> => {
  try {
    // Delete the code and return the number of rows affected
    const result = await db
      .delete(singleUseCode)
      .where(eq(singleUseCode.code, code))

    // In SQLite/D1, the number of rows affected is in result.meta.changes
    const rowsDeleted = result.meta?.changes || 0

    // Return true if exactly one row was deleted (code existed and was consumed)
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
export const addInterestedEmail = async (
  db: any,
  email: string
): Promise<Result<boolean, Error>> => {
  let res: Result<boolean, Error>
  try {
    res = await retry(
      () => addInterestedEmailActual(db, email),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`addInterestedEmail final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

/**
 * Check if an email is already in the interested emails list
 * @param db - Database instance
 * @param email - Email address to check
 * @returns Promise<Result<boolean, Error>> - true if email exists, false otherwise
 */
export const checkInterestedEmailExists = async (
  db: any,
  email: string
): Promise<Result<boolean, Error>> => {
  let res: Result<boolean, Error>
  try {
    res = await retry(
      () => checkInterestedEmailExistsActual(db, email),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`checkInterestedEmailExists final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

/**
 * Private function: Add an email to the interested emails list (actual implementation)
 */
const addInterestedEmailActual = async (
  db: any,
  email: string
): Promise<Result<boolean, Error>> => {
  try {
    // First check if email already exists
    const existingEmails = await db
      .select()
      .from(interestedEmails)
      .where(eq(interestedEmails.email, email))

    if (existingEmails.length > 0) {
      // Email already exists
      return Result.ok(false)
    }

    // Insert the new email
    await db.insert(interestedEmails).values({ email })

    return Result.ok(true)
  } catch (e) {
    return Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Private function: Check if an email exists in interested emails list (actual implementation)
 */
const checkInterestedEmailExistsActual = async (
  db: any,
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
