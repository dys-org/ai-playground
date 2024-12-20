import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function sleep(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
