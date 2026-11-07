import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2000&auto=format&fit=crop';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const getImageUrl = (src: string | undefined | null) => {
    if (!src) return DEFAULT_FALLBACK_IMAGE;
    if (src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) return src;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const apiOrigin = cleanBaseUrl.replace(/\/api\/v1\/?$/, '');
    const cleanPath = src.startsWith('/') ? src : `/${src}`;
    return `${apiOrigin}${cleanPath.startsWith('/uploads') ? cleanPath : `/uploads${cleanPath}`}`;
};

export const mergeContent = (fallback: any, fetched: any) => {
    if (!fetched) return fallback;
    const merged = { ...fallback };
    for (const key in fetched) {
        if (fetched[key] !== null && fetched[key] !== undefined && fetched[key] !== '') {
            merged[key] = fetched[key];
        }
    }
    return merged;
};

export const parseServices = (value?: string) => {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        if (!Array.isArray(parsed)) return [];
        return parsed.flatMap((item: any) => {
            if (typeof item === 'string' && item.trim()) {
                return [{ title: item, desc: item, icon: '' }];
            }
            if (item && typeof item.title === 'string') {
                return [{ ...item, desc: typeof item.desc === 'string' ? item.desc : item.title }];
            }
            return [];
        });
    } catch {
        return [];
    }
};
