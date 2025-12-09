import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function createPageUrl(page: string) {
    // Simple helper to ensure paths start with / and handle any other logic if needed
    const path = page.toLowerCase().replace(/\s+/g, '-');
    return path.startsWith('/') ? path : `/${path}`;
}
