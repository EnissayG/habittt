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

/** "9 juin", "1er octobre"; with the year when it is not today's: "28 février 2024". */
export function dayMonth(date: LocalDate, today: LocalDate): string {
  const day = Number(date.slice(8, 10));
  const month = MONTHS[Number(date.slice(5, 7)) - 1] ?? '';
  const year = date.slice(0, 4) === today.slice(0, 4) ? '' : ` ${date.slice(0, 4)}`;
  return `${day === 1 ? '1er' : day} ${month}${year}`;
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

export interface TextRun {
  text: string;
  /** A run of digits, drawn in the numeric font. */
  number: boolean;
}

/** "Jour 87 · 4 octobre" -> "Jour ", "87", " · ", "4", " octobre". */
export function splitNumbers(text: string): TextRun[] {
  return text
    .split(/(\d+)/)
    .filter((part) => part !== '')
    .map((part) => ({ text: part, number: /^\d/.test(part) }));
}
