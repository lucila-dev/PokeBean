"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { PokeballIcon } from "@/components/PokeballIcon";
import { SafeImage } from "@/components/SafeImage";
import { useTheme } from "@/components/ThemeProvider";

const protectedLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/browse", label: "Browse" },
  { href: "/add", label: "Add Card" },
  { href: "/analytics", label: "Analytics" },
];

function SunIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  );
}

const linkClass = (active: boolean) =>
  `inline-flex h-9 items-center justify-center rounded-button px-3 text-sm font-medium whitespace-nowrap transition-colors focus-ring ${
    active
      ? "bg-pokemon-yellow/20 text-pokemon-yellow font-semibold"
      : "text-stone-200 hover:text-pokemon-yellow hover:bg-white/5"
  }`;

export function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (status !== "loading") {
      setLoadingTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoadingTimedOut(true), 2500);
    return () => clearTimeout(timer);
  }, [status]);

  const showLoading = status === "loading" && !loadingTimedOut;
  const isLoggedIn = status === "authenticated" && Boolean(session);

  return (
    <nav
      className="bg-pokemon-dark text-white shadow-card border-b border-pokemon-dark-muted"
      role="navigation"
      aria-label="Main"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-brand text-xl font-semibold tracking-tight text-pokemon-yellow hover:text-pokemon-yellow-light focus-ring rounded-button sm:text-2xl"
        >
          <PokeballIcon size={24} className="shrink-0" />
          <span>PokeBean</span>
        </Link>

        {showLoading ? (
          <span className="text-sm text-stone-400">Loading…</span>
        ) : isLoggedIn ? (
          <div className="flex min-w-0 items-center gap-1 sm:gap-2">
            <ul className="flex items-center gap-0.5 sm:gap-1">
              {protectedLinks.map(({ href, label }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={linkClass(isActive)}
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="ml-1 flex items-center gap-0.5 border-l border-stone-600 pl-2 sm:ml-2 sm:gap-1 sm:pl-3">
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex h-9 w-9 items-center justify-center rounded-button text-stone-200 hover:bg-white/5 hover:text-pokemon-yellow focus-ring"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </button>
              <Link
                href="/profile"
                aria-current={pathname === "/profile" ? "page" : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-button px-1.5 focus-ring ${
                  pathname === "/profile"
                    ? "bg-pokemon-yellow/20 text-pokemon-yellow font-semibold"
                    : "text-stone-200 hover:bg-white/5 hover:text-pokemon-yellow"
                }`}
                title="Profile"
              >
                {session.user?.image ? (
                  <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-stone-500">
                    <SafeImage
                      src={session.user.image}
                      alt=""
                      width={28}
                      height={28}
                      className="h-full w-full object-cover"
                      placeholderClassName="flex h-7 w-7 items-center justify-center rounded-full bg-stone-600 text-sm font-semibold text-pokemon-yellow"
                      placeholderText={(session.user?.name || session.user?.email || "?").slice(0, 1).toUpperCase()}
                    />
                  </span>
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-600 text-sm font-semibold text-pokemon-yellow">
                    {(session.user?.name || session.user?.email || "?").slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span
                  className="hidden max-w-[100px] truncate text-sm lg:inline"
                  title={session.user?.email ?? undefined}
                >
                  {session.user?.name || session.user?.email}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex h-9 items-center justify-center rounded-button px-2 text-sm font-medium text-stone-200 hover:bg-white/5 hover:text-pokemon-yellow focus-ring whitespace-nowrap"
              >
                Log out
              </button>
            </div>
          </div>
        ) : (
          <ul className="flex items-center gap-1">
            <li>
              <Link
                href="/login"
                aria-current={pathname === "/login" ? "page" : undefined}
                className={linkClass(pathname === "/login")}
              >
                Log in
              </Link>
            </li>
            <li>
              <Link
                href="/register"
                aria-current={pathname === "/register" ? "page" : undefined}
                className={linkClass(pathname === "/register")}
              >
                Register
              </Link>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
