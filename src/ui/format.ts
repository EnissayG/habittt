import type { LocalDate } from '../domain';

const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/** "9 juin", "1er octobre". */
export function dayMonth(date: LocalDate): string {
  const day = Number(date.slice(8, 10));
  const month = MONTHS[Number(date.slice(5, 7)) - 1] ?? '';
  return `${day === 1 ? '1er' : day} ${month}`;
}

/** "3 jours", "1 jour". */
export function days(count: number): string {
  return `${count} ${count > 1 ? 'jours' : 'jour'}`;
}

/** "Fumer" -> "fumer", for "jours sans fumer". */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLocaleLowerCase('fr') + text.slice(1);
}

/** A LocalDate as a Date at local noon (for the native date picker). */
export function toPickerDate(date: LocalDate): Date {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, 12);
}

/** A picker Date back to its local calendar day, 'YYYY-MM-DD'. */
export function fromPickerDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
