import { calculateRankChange } from '../leaderboard'

describe('calculateRankChange', () => {
  it('returns new when previous rank is null', () => {
    expect(calculateRankChange(5, null)).toEqual({
      direction: 'new',
      amount: 0,
    })
  })

  it('returns up when rank improves', () => {
    expect(calculateRankChange(2, 5)).toEqual({
      direction: 'up',
      amount: 3,
    })
  })

  it('returns down when rank worsens', () => {
    expect(calculateRankChange(10, 4)).toEqual({
      direction: 'down',
      amount: 6,
    })
  })

  it('returns same when rank is unchanged', () => {
    expect(calculateRankChange(7, 7)).toEqual({
      direction: 'same',
      amount: 0,
    })
  })
})
