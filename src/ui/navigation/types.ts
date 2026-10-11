import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { HabitId, LocalDate, MonthId } from '../../domain';

export type RootStackParamList = {
  Opening: undefined;
  Shelf: undefined;
  Habit: { id: HabitId };
  /** month: the month shown first (the current one by default). */
  Journal: { id: HabitId; month?: MonthId };
  Retire: { id: HabitId };
  NewHabitName: undefined;
  PlantChoice: { name: string; startDate: LocalDate };
  Settings: undefined;
  Herbarium: undefined;
  /** Screen 12, the meditation corner: from the armchair. */
  Meditation: undefined;
  Lab: undefined;
};

export type ScreenProps<Name extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Name
>;
