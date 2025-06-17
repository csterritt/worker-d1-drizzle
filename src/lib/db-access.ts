/**
 * Database access utility functions for user and session models.
 * @module support/db-access
 */
import { Context } from 'hono'
import Maybe from 'true-myth/maybe'
import Result from 'true-myth/result'
import retry from 'async-retry'
import { eq, and, gt, sql } from 'drizzle-orm'
import { ulid } from 'ulid'

import { createDbClient } from '../db/client'
import { user, session, count, User, Session } from '../db/schema'
import { CountAndDecrement } from '../local-types'
import { STANDARD_RETRY_OPTIONS } from '../constants'
import { getCurrentTime } from './time-access'

/**
 * Find a user by email address.
 * @param db - D1Database instance
 * @param email - User email
 * @returns Result with Maybe.just(user) or Maybe.nothing if not found, or Result.err with error
 */
export const findUserByEmail = async (
  db: D1Database,
  email: string
): Promise<Result<Maybe<User>, Error>> => {
  let res: Result<Maybe<User>, Error>
  try {
    res = await retry(
      () => findUserByEmailActual(db, email),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`findUserByEmail final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const findUserByEmailActual = async (
  db: D1Database,
  email: string
): Promise<Result<Maybe<User>, Error>> => {
  try {
    const drizzle = createDbClient(db)
    const users = await drizzle
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    const foundUser = users[0] || null

    return Result.ok(foundUser ? Maybe.just(foundUser) : Maybe.nothing())
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Find a user by ID.
 * @param db - D1Database instance
 * @param userId - User ID
 * @returns Result with Maybe.just(user) or Maybe.nothing if not found, or Result.err with error
 */
export const findUserById = async (
  db: D1Database,
  userId: string
): Promise<Result<Maybe<User>, Error>> => {
  let res: Result<Maybe<User>, Error>
  try {
    res = await retry(
      () => findUserByIdActual(db, userId),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`findUserById final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const findUserByIdActual = async (
  db: D1Database,
  userId: string
): Promise<Result<Maybe<User>, Error>> => {
  try {
    const drizzle = createDbClient(db)
    const users = await drizzle
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)
    const foundUser = users[0] || null

    return Result.ok(foundUser ? Maybe.just(foundUser) : Maybe.nothing())
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Create a new session.
 * @param db - D1Database instance
 * @param sessionData - Session data object
 * @returns Result with Maybe.just(session) or Maybe.nothing if not created, or Result.err with error
 */
export const createSession = async (
  db: D1Database,
  sessionData: Record<string, unknown>
): Promise<Result<Maybe<Session>, Error>> => {
  let res: Result<Maybe<Session>, Error>
  try {
    res = await retry(
      () => createSessionActual(db, sessionData),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`createSession final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const createSessionActual = async (
  db: D1Database,
  sessionData: Record<string, unknown>
): Promise<Result<Maybe<Session>, Error>> => {
  try {
    const drizzle = createDbClient(db)

    // Transform the data to match the Drizzle schema
    const dataToInsert: any = {
      id: (sessionData.id as string) || ulid(),
      expiresAt: sessionData.expiresAt as string,
      signedIn: Boolean(sessionData.signedIn),
      token: sessionData.token as string,
      attemptCount: Number(sessionData.attemptCount || 0),
      userId: sessionData.userId as string,
      createdAt: sessionData.createdAt || new Date().getTime(),
      updatedAt: sessionData.updatedAt || new Date().getTime(),
    }

    const [insertedSession] = await drizzle
      .insert(session)
      .values(dataToInsert)
      .returning()

    return Result.ok(
      insertedSession ? Maybe.just(insertedSession) : Maybe.nothing()
    )
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Find a session by ID.
 * @param db - D1Database instance
 * @param sessionId - Session ID
 * @returns Result with Maybe.just(session) or Maybe.nothing if not found, or Result.err with error
 */
export const findSessionById = async (
  db: D1Database,
  sessionId: string
): Promise<Result<Maybe<Session>, Error>> => {
  let res: Result<Maybe<Session>, Error>
  try {
    res = await retry(
      () => findSessionByIdActual(db, sessionId),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`findSessionById final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const findSessionByIdActual = async (
  db: D1Database,
  sessionId: string
): Promise<Result<Maybe<Session>, Error>> => {
  try {
    const drizzle = createDbClient(db)
    const sessions = await drizzle
      .select()
      .from(session)
      .where(eq(session.id, sessionId))
      .limit(1)
    const foundSession = sessions[0] || null

    return Result.ok(foundSession ? Maybe.just(foundSession) : Maybe.nothing())
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Update a session by ID.
 * @param db - D1Database instance
 * @param sessionId - Session ID
 * @param updateData - Fields to update
 * @returns Result with Maybe.just(session) or Maybe.nothing if not updated, or Result.err with error
 */
export const updateSessionById = async (
  db: D1Database,
  sessionId: string,
  updateData: Record<string, unknown>
): Promise<Result<Maybe<Session>, Error>> => {
  let res: Result<Maybe<Session>, Error>
  try {
    res = await retry(
      () => updateSessionByIdActual(db, sessionId, updateData),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`updateSessionById final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const updateSessionByIdActual = async (
  db: D1Database,
  sessionId: string,
  updateData: Record<string, unknown>
): Promise<Result<Maybe<Session>, Error>> => {
  try {
    const drizzle = createDbClient(db)

    const [updatedSession] = await drizzle
      .update(session)
      .set(updateData)
      .where(eq(session.id, sessionId))
      .returning()

    return Result.ok(
      updatedSession ? Maybe.just(updatedSession) : Maybe.nothing()
    )
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Delete a session by ID.
 * @param db - D1Database instance
 * @param sessionId - Session ID
 * @returns Result.ok(true) if deleted, Result.err with error otherwise
 */
export const deleteSession = async (
  db: D1Database,
  sessionId: string
): Promise<Result<boolean, Error>> => {
  let res: Result<boolean, Error>
  try {
    res = await retry(
      () => deleteSessionActual(db, sessionId),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`deleteSession final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const deleteSessionActual = async (
  db: D1Database,
  sessionId: string
): Promise<Result<boolean, Error>> => {
  try {
    const drizzle = createDbClient(db)
    const result = await drizzle
      .delete(session)
      .where(eq(session.id, sessionId))

    return Result.ok(true)
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Find the count record by id.
 * @param db - D1Database instance
 * @param countId - Count record id
 * @param failureCount - Optional number of failures to simulate (for testing)
 * @returns Result with Maybe.just(count) or Maybe.nothing if not found, or Result.err with error
 */
export const findCountById = async (
  db: D1Database,
  countId: string,
  failureCount?: CountAndDecrement
): Promise<Result<Maybe<number>, Error>> => {
  let res: Result<Maybe<number>, Error>
  try {
    res = await retry(
      () => findCountByIdActual(db, countId, failureCount),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`findCountById final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const findCountByIdActual = async (
  db: D1Database,
  countId: string,
  failureCount?: CountAndDecrement
): Promise<Result<Maybe<number>, Error>> => {
  try {
    // Optional failure for testing
    if (failureCount && failureCount.count > 0) {
      failureCount.count -= 1
      throw new Error(`Simulated DB failure ${failureCount.count} remaining`)
    }

    const drizzle = createDbClient(db)
    const counts = await drizzle
      .select()
      .from(count)
      .where(eq(count.id, countId))
      .limit(1)
    const foundCount = counts[0] || null

    return Result.ok(
      foundCount ? Maybe.just(foundCount.count) : Maybe.nothing()
    )
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Increment the count record by id.
 * @param db - D1Database instance
 * @param countId - Count record id
 * @param failureCount - Optional number of failures to simulate (for testing)
 * @returns Result with Maybe.just(updated) or Maybe.nothing if not updated, or Result.err with error
 */
export const incrementCountById = async (
  db: D1Database,
  countId: string,
  failureCount?: CountAndDecrement
): Promise<Result<Maybe<number>, Error>> => {
  let res: Result<Maybe<number>, Error>
  try {
    res = await retry(
      () => incrementCountByIdActual(db, countId, failureCount),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`incrementCountById final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const incrementCountByIdActual = async (
  db: D1Database,
  countId: string,
  failureCount?: CountAndDecrement
): Promise<Result<Maybe<number>, Error>> => {
  try {
    // Optional failure for testing
    if (failureCount && failureCount.count > 0) {
      failureCount.count -= 1
      throw new Error(`Simulated DB failure ${failureCount.count} remaining`)
    }

    const drizzle = createDbClient(db)

    // Using SQL template literal for direct increment
    const result = await drizzle
      .update(count)
      .set({
        count: sql`${count.count} + 1`,
      })
      .where(eq(count.id, countId))

    return Result.ok(
      result.meta?.changes > 0
        ? Maybe.just(result.meta.changes)
        : Maybe.nothing()
    )
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Count non-signed-in sessions for a given email within the rate limit window.
 * @param c - Hono context
 * @param db - D1Database instance
 * @param email - User email
 * @param windowMs - Time window in milliseconds
 * @returns Result with the count of recent non-signed-in sessions, or Result.err with error
 */
export const countRecentNonSignedInSessionsByEmail = async (
  c: Context,
  db: D1Database,
  email: string,
  windowMs: number
): Promise<Result<number, Error>> => {
  let res: Result<number, Error>
  try {
    res = await retry(
      () => countRecentNonSignedInSessionsByEmailActual(c, db, email, windowMs),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`countRecentNonSignedInSessionsByEmail final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const countRecentNonSignedInSessionsByEmailActual = async (
  c: Context,
  db: D1Database,
  email: string,
  windowMs: number
): Promise<Result<number, Error>> => {
  try {
    const drizzle = createDbClient(db)
    const currentTime = getCurrentTime(c)
    const windowStartTime = new Date(currentTime.getTime() - windowMs).getTime()

    // First, find the user
    const users = await drizzle
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    const foundUser = users[0]

    if (!foundUser) {
      return Result.ok(0) // No user found, so no sessions
    }

    // Count the sessions matching our criteria
    const result = await drizzle
      .select({ count: sql<number>`count(*)` })
      .from(session)
      .where(
        and(
          eq(session.userId, foundUser.id),
          eq(session.signedIn, false),
          gt(session.createdAt, windowStartTime)
        )
      )
      .limit(1)

    const sessionCount = result[0]?.count || 0
    return Result.ok(sessionCount)
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}

/**
 * Delete all sessions for a specific user identified by email.
 * @param db - D1Database instance
 * @param email - User email
 * @returns Result.ok(number) with count of deleted sessions, or Result.err with error
 */
export const deleteAllUserSessions = async (
  db: D1Database,
  email: string
): Promise<Result<number, Error>> => {
  let res: Result<number, Error>
  try {
    res = await retry(
      () => deleteAllUserSessionsActual(db, email),
      STANDARD_RETRY_OPTIONS
    )
  } catch (err) {
    console.log(`deleteAllUserSessions final error:`, err)
    res = Result.err(err instanceof Error ? err : new Error(String(err)))
  }

  return res
}

const deleteAllUserSessionsActual = async (
  db: D1Database,
  email: string
): Promise<Result<number, Error>> => {
  try {
    const drizzle = createDbClient(db)

    // First, find the user
    const users = await drizzle
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1)
    const foundUser = users[0]

    if (!foundUser) {
      return Result.ok(0) // No user found, so no sessions to delete
    }

    // Delete all sessions for the user and count them
    const result = await drizzle
      .delete(session)
      .where(eq(session.userId, foundUser.id))

    // Access the meta property which contains information about affected rows
    return Result.ok(result.meta?.changes || 0)
  } catch (e) {
    throw Result.err(e instanceof Error ? e : new Error(String(e)))
  }
}
