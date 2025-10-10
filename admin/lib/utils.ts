import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Объединение классов Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование даты
 */
export function formatDate(date: string | Date) {
  const d = new Date(date);
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Форматирование числа
 */
export function formatNumber(num: number) {
  return new Intl.NumberFormat('ru-RU').format(num);
}

/**
 * Задержка (для демо)
 */
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}