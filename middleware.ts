import "@/lib/auth-env";
import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/browse", "/browse/:path*", "/add", "/add/:path*", "/analytics", "/analytics/:path*"],
};
