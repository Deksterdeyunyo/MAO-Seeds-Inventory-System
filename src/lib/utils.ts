import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQuantity(qty: number, unit: string) {
  return `${qty} ${unit}`;
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'available':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'low_stock':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'out_of_stock':
      return 'bg-rose-100 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
