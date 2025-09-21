import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Handle /ar root path redirect
  if (pathname === '/ar') {
    // Check for authentication (you can customize this logic)
    const hasAuth = request.cookies.has('access_token') || request.cookies.has('authToken');
    
    if (hasAuth) {
      // Redirect authenticated users to Arabic chat
      return NextResponse.redirect(new URL('/ar/chat', request.url));
    } else {
      // Redirect unauthenticated users to Arabic signin
      return NextResponse.redirect(new URL('/ar/signin', request.url));
    }
  }
  
  // Rewrite /ar/* paths to remove /ar prefix for internal routing
  if (pathname.startsWith('/ar/')) {
    const newPathname = pathname.replace('/ar', '') || '/';
    return NextResponse.rewrite(new URL(newPathname, request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/ar', '/ar/:path*']
};