import { describe, expect, it } from 'vitest'
import { arrayMove } from './arrayMove'

describe('arrayMove', () => {
  it('moves an item forward', () => {
    const result = arrayMove(['a', 'b', 'c', 'd'], 1, 3)
    expect(result).toEqual(['a', 'c', 'd', 'b'])
  })

  it('moves an item backward', () => {
    const result = arrayMove(['a', 'b', 'c', 'd'], 3, 1)
    expect(result).toEqual(['a', 'd', 'b', 'c'])
  })

  it('returns original array when indices match', () => {
    const items = ['a', 'b', 'c']
    const result = arrayMove(items, 1, 1)
    expect(result).toBe(items)
  })

  it('returns original array when indices are out of bounds', () => {
    const items = ['a', 'b', 'c']
    expect(arrayMove(items, -1, 1)).toBe(items)
    expect(arrayMove(items, 1, 3)).toBe(items)
  })
})
