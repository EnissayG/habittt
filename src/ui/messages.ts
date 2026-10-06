import type { CreateHabitError, ToggleRelapseError } from '../domain';
import { HABIT_NAME_MAX_LENGTH } from '../domain';

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
