import type { CreateHabitError, Mood, ToggleRelapseError, WaterTodayError } from '../domain';
import { HABIT_NAME_MAX_LENGTH, NOTE_MAX_LENGTH } from '../domain';

export const createHabitErrorMessage: Record<CreateHabitError, string> = {
  NAME_EMPTY: 'Donne un nom à ton habitude.',
  NAME_TOO_LONG: `Le nom ne peut pas dépasser ${HABIT_NAME_MAX_LENGTH} caractères.`,
  START_DATE_IN_FUTURE: 'Le début ne peut pas être dans le futur.',
};

export const toggleRelapseErrorMessage: Record<ToggleRelapseError, string> = {
  RELAPSE_IN_FUTURE: 'On ne peut pas déclarer une rechute dans le futur.',
  RELAPSE_BEFORE_START: 'Ce jour est avant le début du suivi.',
  HABIT_NOT_FOUND: "Cette habitude n'existe plus.",
};

export const noteErrorMessage: Record<WaterTodayError, string> = {
  NOTE_IN_FUTURE: 'On ne peut pas écrire pour un jour à venir.',
  NOTE_BEFORE_START: 'Ce jour est avant le début du suivi.',
  NOTE_TOO_LONG: `Une note ne peut pas dépasser ${NOTE_MAX_LENGTH} caractères.`,
  WATERING_IN_FUTURE: 'On ne peut pas arroser un jour à venir.',
  WATERING_BEFORE_START: 'Ce jour est avant le début du suivi.',
  HABIT_NOT_FOUND: "Cette habitude n'existe plus.",
};

/** The mockup's moods, in its order. */
export const MOOD_LABELS: Record<Mood, string> = {
  proud: 'fier',
  craving: 'envie forte',
  stress: 'stress',
  easy: 'facile',
};
