import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const user = request.cookies.get('user');

  if (request.nextUrl.pathname.startsWith('/stok')) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/stok/:path*'],
};
