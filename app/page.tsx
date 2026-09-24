"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) router.replace("/dashboard");
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="animate-[zoom-in_0.7s_ease-out] w-full max-w-md overflow-hidden rounded-3xl border border-neutral-200 bg-white/80 p-8 text-center shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Powerzone Fitness logo"
            width={96}
            height={96}
            priority
            className="h-24 w-24 rounded-full object-contain"
          />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl dark:text-white">
            Powerzone Fitness
          </h1>
          <p className="mt-3 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
            Manage members, memberships, and daily attendance for your gym.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-8 w-48 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}