"use client";

import { useState } from "react";
import Image from "next/image";

export default function HomePage() {
  const [mode, setMode] = useState<"hero" | "login">("hero");
  const login = mode === "login";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div
        className={`animate-zoom-in w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-xl backdrop-blur-xl transition-all duration-700 ease-out dark:border-neutral-800 dark:bg-neutral-900/80 ${
          login ? "sm:max-w-sm" : ""
        }`}
      >
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Powerzone Fitness logo"
            width={96}
            height={96}
            priority
            className={`rounded-full object-contain transition-all duration-700 ease-out ${
              login ? "h-12 w-12" : "h-24 w-24"
            }`}
          />
          <h1
            className={`mt-4 font-bold tracking-tight text-neutral-900 transition-all duration-700 ease-out dark:text-white ${
              login ? "text-xl font-medium tracking-normal" : "text-4xl sm:text-5xl"
            }`}
          >
            Powerzone Fitness
          </h1>

          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${
              login ? "max-h-0 opacity-0" : "max-h-40 opacity-100 delay-150"
            }`}
          >
            <button
              onClick={() => setMode("login")}
              className="mt-8 w-48 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Login
            </button>
          </div>

          <div
            className={`w-full overflow-hidden text-left transition-all duration-700 ease-out ${
              login ? "mt-4 max-h-96 opacity-100 delay-200" : "max-h-0 opacity-0"
            }`}
          >
            <button
              onClick={() => setMode("hero")}
              className="mb-4 text-xs font-medium text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            >
              ← Back
            </button>
            <form className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@powerzone.com"
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}