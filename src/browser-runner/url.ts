export function resolveTargetUrl(previewUrl: string, route?: string): string {
  if (!route || route.trim() === '') return previewUrl;

  try {
    return new URL(route).toString();
  } catch {
    const base = previewUrl.endsWith('/') ? previewUrl : `${previewUrl}/`;
    const normalizedRoute = route.startsWith('/') ? route.slice(1) : route;
    return new URL(normalizedRoute, base).toString();
  }
}
