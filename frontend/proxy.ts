import { NextRequest, NextResponse } from "next/server";
import { getSafeRedirectPath } from "./lib/auth-redirect";
import { authRoutes, privateRoutes, publicRoutes } from "./routes/routes";

export const proxy = (request: NextRequest) => {
  const path = request.nextUrl.pathname;
  // FastAPI sets the login cookie with this exact name.
  const token = request.cookies.get("access_token")?.value;
  const isAuthRoute = authRoutes.includes(path);
  
  // Match private pages and their nested paths, such as /dashboard/settings.
  const isPrivateRoute = privateRoutes.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );

  // Logged-in users don't need auth pages; honor a safe requested page or use the dashboard.
  if (token && isAuthRoute) {
    const redirectPath = getSafeRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
    );
    return NextResponse.redirect(
      new URL(redirectPath ?? "/", request.nextUrl),
    );
  }

  // Save the requested private page so login can send the user back to it.
  if (!token && !isAuthRoute && !publicRoutes.includes(path) && isPrivateRoute) {
    console.log("No token found. Redirecting to login page.");
    const loginUrl = new URL("/login", request.nextUrl);

    // Keep the query string too, for example /dashboard?tab=recent.
    const requestedUrl = getSafeRedirectPath(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    if (requestedUrl) {
      loginUrl.searchParams.set("redirect", requestedUrl);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Run this proxy on page routes, but skip API calls and static files.
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for the ones starting with:
     * - sw.js (Service Worker)
     * - _next/static (static files like CSS/JS)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes, unless you specifically want middleware to protect those too)
     */
    '/((?!sw.js|_next/static|_next/image|favicon.ico|api).*)',
  ],
}


