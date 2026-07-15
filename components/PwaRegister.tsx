"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

const DISMISS_KEY = "pokebean-pwa-dismissed";

export function PwaRegister() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Install UI still works without SW on some browsers; ignore register errors
      });
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    if (isIos()) {
      setShowIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
    setDeferred(null);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-700 dark:bg-stone-900 sm:left-auto">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold text-pokemon-dark dark:text-stone-100">
            Install PokeBean
          </p>
          {showIosHint && !deferred ? (
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              On iPhone: tap{" "}
              <span className="font-semibold">Share</span> →{" "}
              <span className="font-semibold">Add to Home Screen</span>.
            </p>
          ) : (
            <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
              Add to your home screen for quick access — free, no app store.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-lg px-2 py-1 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        {deferred ? (
          <button
            type="button"
            onClick={install}
            className="flex-1 rounded-xl bg-pokemon-yellow px-3 py-2 text-sm font-bold text-pokemon-dark focus-ring"
          >
            Install
          </button>
        ) : null}
        <button
          type="button"
          onClick={dismiss}
          className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm font-medium text-stone-600 dark:border-stone-600 dark:text-stone-300 focus-ring"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
