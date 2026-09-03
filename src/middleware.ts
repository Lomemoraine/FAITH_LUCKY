import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const stagingPassword = process.env.STAGING_ACCESS_PASSWORD;

  // In local development, allow direct access without staging password lock
  if (process.env.NODE_ENV !== "production" || !stagingPassword) {
    return NextResponse.next();
  }

  // Bypass public static assets and auth callback routes
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/api/staging-auth") ||
    pathname.match(/\.(png|jpg|jpeg|svg|css|js|woff|woff2)$/)
  ) {
    return NextResponse.next();
  }

  // Check for staging password cookie
  const stagingCookie = request.cookies.get("staging_auth")?.value;
  if (stagingCookie === stagingPassword) {
    return NextResponse.next();
  }

  // Check URL query param ?staging_pass=...
  const queryPass = request.nextUrl.searchParams.get("staging_pass");
  if (queryPass === stagingPassword) {
    const response = NextResponse.redirect(new URL(pathname, request.url));
    response.cookies.set("staging_auth", stagingPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return response;
  }

  // Allow basic API auth header if testing
  const authHeader = request.headers.get("x-staging-password");
  if (authHeader === stagingPassword) {
    return NextResponse.next();
  }

  // If accessing staging login API or page, return unauthorized or password prompt
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Staging access password required." }, { status: 401 });
  }

  // Render HTML password prompt
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>TFL SafeSpace - Staging Access</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FFF9F5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { background: white; padding: 2rem; border-radius: 1.25rem; box-shadow: 0 10px 25px -5px rgba(224, 122, 95, 0.1); width: 100%; max-width: 380px; text-align: center; border: 1px solid #FFE4D6; }
        h1 { font-size: 1.25rem; color: #1E293B; margin-bottom: 0.5rem; }
        p { font-size: 0.875rem; color: #64748B; margin-bottom: 1.5rem; }
        input { width: 100%; box-sizing: border-box; padding: 0.75rem 1rem; border: 1px solid #CBD5E1; border-radius: 0.75rem; margin-bottom: 1rem; font-size: 1rem; }
        input:focus { outline: none; border-color: #E07A5F; box-shadow: 0 0 0 3px rgba(224, 122, 95, 0.2); }
        button { width: 100%; padding: 0.75rem 1rem; background: #E07A5F; color: white; border: none; border-radius: 0.75rem; font-size: 1rem; font-weight: 600; cursor: pointer; }
        button:hover { background: #C8654B; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🌸 TFL SafeSpace Staging</h1>
        <p>Please enter the staging access password to continue.</p>
        <form method="GET">
          <input type="password" name="staging_pass" placeholder="Staging Password" required autofocus />
          <button type="submit">Access Staging</button>
        </form>
      </div>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 401,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
