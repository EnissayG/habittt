import type { Habit } from './habit';
import { addDays, daysBetween, type LocalDate } from './localDate';
import { isActive, type Relapse } from './relapse';
import { replantSeed, type Replanting } from './replanting';

// A habit's successive lives (ADR 0013). Each relapse ends the life in
// course: its plant is dead. A replanting starts the next one, with its own
// seed. Nothing here is stored: lives are always derived from the relapses
// and replantings, so cancelling a mistaken relapse brings a plant back.

export interface Life {
  /** 0 for the first life. */
  index: number;
  seed: number;
  /** The day it was planted: the habit's start, or a replanting's day. */
  start: LocalDate;
  /**
   * Its first counted day: the start for the first life (a habit started
   * today shows 1 day), the day after the replanting otherwise (the counter
   * shows 0 on the day one replants).
   */
  firstDay: LocalDate;
  /** The relapse that ended it; null while it lives. */
  end: LocalDate | null;
  /** Days held: up to the last day while it lives, up to the eve of its relapse once dead. */
  days: number;
  dead: boolean;
}

export interface SplitLivesParams {
  habit: Pick<Habit, 'startDate' | 'seed' | 'id'>;
  relapses: readonly Relapse[];
  replantings: readonly Replanting[];
  /** The last day counted: today, or the day a retired plant left the shelf. */
  today: LocalDate;
}

const byDate = (a: { date: LocalDate }, b: { date: LocalDate }) => a.date.localeCompare(b.date);

export function splitLives({ habit, relapses, replantings, today }: SplitLivesParams): Life[] {
  const deaths = relapses
    .filter(isActive)
    .filter((relapse) => relapse.date <= today)
    .sort(byDate);
  const plantings = replantings.filter((replanting) => replanting.date <= today).sort(byDate);

  const lives: Life[] = [];
  let start = habit.startDate;
  let seed = habit.seed;
  let firstDay = start;
  for (;;) {
    const index = lives.length;
    // The first life ends on a relapse from its start day on; a replanted
    // one only after its replanting day (that day's relapse is the last life's).
    const killer = deaths.find((relapse) =>
      index === 0 ? relapse.date >= start : relapse.date > start,
    );
    if (!killer) {
      const days = Math.max(0, daysBetween(firstDay, today) + 1);
      lives.push({ index, seed, start, firstDay, end: null, days, dead: false });
      return lives;
    }
    const days = Math.max(0, daysBetween(firstDay, killer.date));
    lives.push({ index, seed, start, firstDay, end: killer.date, days, dead: true });

    const next = plantings.find((replanting) => replanting.date >= killer.date);
    if (!next) return lives;
    start = next.date;
    seed = replantSeed(habit.id, start);
    firstDay = addDays(start, 1);
  }
}

/** The most days one life held. */
export function record(lives: readonly Life[]): number {
  return Math.max(0, ...lives.map((life) => life.days));
}
