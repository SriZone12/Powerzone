"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Status = "loading" | "authed" | "unauthed";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setStatus(data.session ? "authed" : "unauthed");
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        if (session) {
          setStatus("authed");
        } else if (!cancelled) {
          setStatus("unauthed");
        }
      }
    );

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status === "unauthed") {
      router.replace("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthed") {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Checking access…</p>
      </div>
    );
  }

  return <>{children}</>;
}