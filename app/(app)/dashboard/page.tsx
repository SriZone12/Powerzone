"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, UserMinus, CalendarCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";

type Summary = {
  total: number;
  active: number;
  expired: number;
  today: number;
};

type RecentMember = {
  full_name: string | null;
  membership_plan: string | null;
  status: string | null;
  created_at: string | null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const today = formatLocalDate(new Date());

      const [totalRes, activeRes, expiredRes, todayRes, recentRes] = await Promise.all([
        supabase.from("members").select("id", { count: "exact", head: true }),
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("members")
          .select("id", { count: "exact", head: true })
          .eq("status", "expired"),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("date", today),
        supabase
          .from("members")
          .select("full_name, membership_plan, status, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (cancelled) return;

      const failed = [totalRes, activeRes, expiredRes, todayRes, recentRes].find(
        (r) => r.error
      );
      if (failed?.error) {
        setError(friendlyError(failed.error.code));
        setLoading(false);
        return;
      }

      setSummary({
        total: totalRes.count ?? 0,
        active: activeRes.count ?? 0,
        expired: expiredRes.count ?? 0,
        today: todayRes.count ?? 0,
      });
      setRecent((recentRes.data ?? []) as RecentMember[]);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
        Dashboard
      </h1>
      <div className="mt-3 h-px w-16 bg-neutral-300 dark:bg-neutral-700" />
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        Overview of your gym&apos;s activity and key metrics.
      </p>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          Failed to load dashboard data: {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 flex items-center justify-center gap-3 px-6 py-16">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading dashboard…</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Members"
              value={summary?.total ?? 0}
              icon={<Users className="h-5 w-5" />}
              accent="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
            />
            <StatCard
              title="Active Members"
              value={summary?.active ?? 0}
              icon={<UserCheck className="h-5 w-5" />}
              accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            />
            <StatCard
              title="Expired Members"
              value={summary?.expired ?? 0}
              icon={<UserMinus className="h-5 w-5" />}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            />
            <StatCard
              title="Today&apos;s Attendance"
              value={summary?.today ?? 0}
              icon={<CalendarCheck className="h-5 w-5" />}
              accent="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            />
          </div>

          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Recent Members
            </h2>

            {recent.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  No members yet
                </p>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Newly joined members will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Plan</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Join Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {recent.map((member, i) => (
                      <tr
                        key={i}
                        className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      >
                        <td className="px-4 py-4 font-medium text-neutral-900 dark:text-white">
                          {member.full_name ?? "—"}
                        </td>
                        <td className="px-4 py-4">
                          {member.membership_plan ? (
                            <span className="rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
                              {member.membership_plan}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={member.status} />
                        </td>
                        <td className="px-4 py-4 text-neutral-600 dark:text-neutral-300">
                          {member.created_at ? formatDate(member.created_at) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-neutral-400">—</span>;

  const active = status.toLowerCase() === "active";

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}