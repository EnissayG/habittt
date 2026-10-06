import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { HabitId, LocalDate } from '../../domain';

export type RootStackParamList = {
  Opening: undefined;
  Shelf: undefined;
  Habit: { id: HabitId };
  History: { id: HabitId };
  NewHabitName: undefined;
  PlantChoice: { name: string; startDate: LocalDate };
  Settings: undefined;
  Lab: undefined;
};

export type ScreenProps<Name extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Name
>;
