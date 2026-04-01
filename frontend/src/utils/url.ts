/**
 * Resolves an image URL from the backend.
 * If the path is already an absolute URL (e.g., starts with http from Cloudinary), it returns it as is.
 * Otherwise, it prepends the API URL for local static files.
 */
export const resolveImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // If it's already an absolute URL (like Cloudinary), return it
  if (path.startsWith('http')) {
    return path;
  }
  
  // Otherwise, prepend the API URL (strip /api/v1 if present in the base URL)
  const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api/v1', '');
  
  // Ensure the path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
};
