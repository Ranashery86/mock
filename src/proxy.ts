import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function withSupabaseResponse(
  response: NextResponse,
  supabaseResponse: NextResponse
) {
  for (const { name, value, ...options } of supabaseResponse.cookies.getAll()) {
    response.cookies.set(name, value, options);
  }
  for (const key of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(key);
    if (value) response.headers.set(key, value);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  // Authenticated users should not see the login page.
  if (isLoggedIn && pathname === "/login") {
    const response = NextResponse.redirect(new URL("/", request.url));
    return withSupabaseResponse(response, supabaseResponse);
  }

  // Protect everything else.
  if (!isLoggedIn && pathname !== "/login") {
    const response = NextResponse.redirect(new URL("/login", request.url));
    return withSupabaseResponse(response, supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};