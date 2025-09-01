// ====================================
// Tests for time-access.ts
// To run this, cd to this directory and type 'bun test'
// ====================================

import { beforeEach, describe, it } from 'node:test'
import assert from 'node:assert'
import { setTimeout } from 'timers/promises'
import {
  getCurrentTime,
  setCurrentDelta,
  clearCurrentDelta,
} from '../src/lib/time-access'

const approximatelyEqual = (v1: number, v2: number, epsilon = 0.001) =>
  Math.abs(v1 - v2) < epsilon

const makeFakeContext = () => {
  const storage = new Map()
  const cookieStorage = {
    get: (name: string) => {
      // @ts-ignore
      return storage.get(name)
    },
    set: (name: string, value: string) => {
      // @ts-ignore
      storage.set(name, value)
    },
  }

  // c.req.raw.headers.get("Cookie");
  // c.header("Set-Cookie", cookie, { append: true });
  return {
    req: {
      raw: {
        headers: {
          get: (name: string) => {
            if (name === 'Cookie' || name === 'cookie') {
              return cookieStorage.get('Cookie')
            }
          },
        },
      },
    },
    header: (name: string, value: string, options?: any) => {
      void options
      if (name === 'Set-Cookie') {
        cookieStorage.set('Cookie', value)
      } else {
        throw new Error(`Unknown header ${name}`)
      }
    },
  }
}

describe('getCurrentTime function', () => {
  let c: any = null
  beforeEach(() => {
    c = makeFakeContext()
  })
  it('should return the current no-args time when no time has been set', () => {
    assert(
      approximatelyEqual(getCurrentTime(c).getTime(), new Date().getTime(), 5)
    )
  })

  it('should return the correct no-args time when a time has been set in the past', () => {
    setCurrentDelta(c, -50_000)
    assert(
      approximatelyEqual(
        getCurrentTime(c).getTime(),
        new Date().getTime() - 50_000,
        5
      )
    )
  })

  it('should return the correct no-args time when a time has been set in the future', () => {
    setCurrentDelta(c, 50_000)
    assert(
      approximatelyEqual(
        getCurrentTime(c).getTime(),
        new Date().getTime() + 50_000,
        5
      )
    )
  })

  it('should return the correct no-args time with a delay when a time has been set in the past', async () => {
    setCurrentDelta(c, -50_000)
    await setTimeout(100)
    assert(
      approximatelyEqual(
        getCurrentTime(c).getTime(),
        new Date().getTime() - 50_000,
        105
      )
    )
  })

  it('should return the correct no-args time with a delay when a time has been set in the future', async () => {
    setCurrentDelta(c, 50_000)
    await setTimeout(100)
    assert(
      approximatelyEqual(
        getCurrentTime(c).getTime(),
        new Date().getTime() + 50_000,
        105
      )
    )
  })

  it('should return the correct with-args time based in the past', () => {
    setCurrentDelta(c, -50_000)
    const futureDate = new Date(new Date().getTime() + 100_000)
    assert(
      approximatelyEqual(
        getCurrentTime(c, futureDate).getTime(),
        new Date().getTime() + 50_000,
        5
      )
    )
  })

  it('should return the correct with-args time based in the future', () => {
    setCurrentDelta(c, 50_000)
    const futureDate = new Date(new Date().getTime() + 100_000)
    assert(
      approximatelyEqual(
        getCurrentTime(c, futureDate).getTime(),
        new Date().getTime() + 150_000,
        5
      )
    )
  })

  it('should allow resetting the time properly', () => {
    setCurrentDelta(c, -50_000)
    clearCurrentDelta(c)
    assert(
      approximatelyEqual(getCurrentTime(c).getTime(), new Date().getTime(), 5)
    )
  })
})
