// A local base URL lets us parse redirect paths without using the current host.
const REDIRECT_BASE_URL = "http://localhost:3000";

export function getSafeRedirectPath(redirect: string | null): string | null {
  // Only accept paths that start on this site; reject external links.
  if (!redirect?.startsWith("/") || redirect.startsWith("//")) {
    return null;
  }

  // Double-check the parsed URL still points to this site.
  const redirectUrl = new URL(redirect, REDIRECT_BASE_URL);
  if (redirectUrl.origin !== REDIRECT_BASE_URL) {
    return null;
  }

  // Return only the path and its optional query and page fragment.
  return `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`;
}

export function getRedirectHref(path: string, redirect: string | null): string {
  // If there is no safe destination, use the auth page as-is.
  const safeRedirect = getSafeRedirectPath(redirect);
  if (!safeRedirect) {
    return path;
  }

  // Add the destination as an encoded `redirect` query parameter.
  const searchParams = new URLSearchParams({ redirect: safeRedirect });
  return `${path}?${searchParams.toString()}`;
}
