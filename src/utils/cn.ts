import { clsx, type ClassValue } from 'clsx';

/**
 * Utility to conditionally join classNames together.
 * Wrapper around clsx for consistent usage across the app.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
