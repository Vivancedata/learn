import { NextResponse } from "next/server";
 
// This function can be marked `async` if using `await` inside
export function middleware() {
  // For now, we'll just pass through all requests
  // We'll implement proper authentication later when we have Clerk set up correctly
  return NextResponse.next();
}
 
 
 
export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
