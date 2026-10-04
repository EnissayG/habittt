import { NOW, TODAY, day, makeRelapse } from './testSupport';
import { buildTimeline } from './timeline';

describe('buildTimeline', () => {
  it('lists every day from start to today, oldest first', () => {
    const timeline = buildTimeline({ startDate: day(-2), relapses: [], today: TODAY });
    expect(timeline).toEqual([
      { index: 0, date: day(-2), relapsed: false },
      { index: 1, date: day(-1), relapsed: false },
      { index: 2, date: TODAY, relapsed: false },
    ]);
  });

  it('marks days with an active relapse only', () => {
    const timeline = buildTimeline({
      startDate: day(-2),
      relapses: [makeRelapse(day(-1)), makeRelapse(TODAY, { deletedAt: NOW })],
      today: TODAY,
    });
    expect(timeline.map((entry) => entry.relapsed)).toEqual([false, true, false]);
  });

  it('is empty when today is before the start date', () => {
    expect(buildTimeline({ startDate: TODAY, relapses: [], today: day(-1) })).toEqual([]);
  });
});
