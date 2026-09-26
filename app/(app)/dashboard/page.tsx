"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserCheck,
  UserMinus,
  CalendarCheck,
  TriangleAlert,
  RefreshCw,
  CircleCheck,
  Phone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";
import { daysUntil, formatLocalDate, formatYmd } from "@/lib/dates";
import RenewModal from "@/components/RenewModal";

// A membership is "expiring soon" when it lapses within this many days.
const EXPIRING_WINDOW_DAYS = 7;

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

type ExpiringMember = {
  id: string;
  full_name: string | null;
  membership_plan: string | null;
  membership_end: string | null;
  phone: string | null;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recent, setRecent] = useState<RecentMember[]>([]);
  const [expiring, setExpiring] = useState<ExpiringMember[]>([]);
  const [expiringError, setExpiringError] = useState<string | null>(null);
  const [todayDate, setTodayDate] = useState("");
  const [renewTarget, setRenewTarget] = useState<ExpiringMember | null>(null);
  // Bumped after a renewal to re-run the load effect and refresh the panel.
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const now = new Date();
      const today = formatLocalDate(now);
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() + EXPIRING_WINDOW_DAYS);
      const cutoffDate = formatLocalDate(cutoff);

      // Silently expire any members whose membership_end has passed.
      // Errors are intentionally ignored — stats will still load even if the
      // function doesn't exist yet (e.g., before the Supabase setup is run).
      await supabase.rpc("expire_members").then(
        () => {},
        () => {}
      );

      if (cancelled) return;

      const [totalRes, activeRes, expiredRes, todayRes, recentRes, expiringRes] =
        await Promise.all([
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
          // Memberships lapsing within the window, soonest first. The
          // membership_end >= today bound also hides already-lapsed members
          // that are still marked active because expire_members doesn't exist.
          supabase
            .from("members")
            .select("id, full_name, membership_plan, membership_end, phone")
            .eq("status", "active")
            .gte("membership_end", today)
            .lte("membership_end", cutoffDate)
            .order("membership_end", { ascending: true }),
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

      // Handled separately on purpose: this is an additive alert, so a failure
      // here (e.g. a missing column) must not blank out the whole dashboard.
      if (expiringRes.error) setExpiringError(friendlyError(expiringRes.error.code));
      else setExpiring(expiringRes.data ?? []);

      // Days-left is measured against the same "today" the query used, so the
      // badges always agree with the rows that were returned.
      setTodayDate(today);

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
  }, [reloadKey]);

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
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
                {expiring.length > 0 ? (
                  <TriangleAlert className="h-4 w-4 text-amber-500" />
                ) : (
                  <CircleCheck className="h-4 w-4 text-emerald-500" />
                )}
                Expiring Soon
                {expiring.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    {expiring.length} within {EXPIRING_WINDOW_DAYS} days
                  </span>
                )}
              </h2>
              {expiring.length > 0 && (
                <Link
                  href="/members"
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Manage members
                </Link>
              )}
            </div>

            {expiringError ? (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                Couldn&apos;t load expiring memberships: {expiringError}
              </p>
            ) : expiring.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                No memberships lapse in the next {EXPIRING_WINDOW_DAYS} days.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <th className="py-3 pr-6 font-medium">Name</th>
                      <th className="py-3 pr-6 font-medium">Plan</th>
                      <th className="py-3 pr-6 font-medium">Expires</th>
                      <th className="py-3 pr-6 font-medium">Time Left</th>
                      <th className="py-3 pr-6 font-medium">Contact</th>
                      <th className="py-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {expiring.map((member) => {
                      const days = member.membership_end
                        ? daysUntil(member.membership_end, todayDate)
                        : null;
                      return (
                        <tr
                          key={member.id}
                          className="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                        >
                          <td className="py-4 pr-6 font-medium text-neutral-900 dark:text-white">
                            {member.full_name ?? "—"}
                          </td>
                          <td className="py-4 pr-6 text-neutral-600 dark:text-neutral-300">
                            {member.membership_plan ?? "—"}
                          </td>
                          <td className="py-4 pr-6 text-neutral-600 dark:text-neutral-300">
                            {member.membership_end
                              ? formatYmd(member.membership_end)
                              : "—"}
                          </td>
                          <td className="py-4 pr-6">
                            <DaysLeftBadge days={days} />
                          </td>
                          <td className="py-4 pr-6 text-neutral-600 dark:text-neutral-300">
                            {member.phone ? (
                              <a
                                href={`tel:${member.phone}`}
                                className="inline-flex items-center gap-1.5 hover:text-neutral-900 hover:underline dark:hover:text-white"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {member.phone}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              type="button"
                              onClick={() => setRenewTarget(member)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Renew
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

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

      {renewTarget && (
        <RenewModal
          member={renewTarget}
          onClose={() => setRenewTarget(null)}
          onRenewed={() => setReloadKey((k) => k + 1)}
        />
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

function DaysLeftBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-neutral-400">—</span>;

  if (days <= 0) {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
        Today
      </span>
    );
  }

  const urgent = days <= 3;

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        urgent
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
      }`}
    >
      {days} day{days !== 1 ? "s" : ""}
    </span>
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

// membership_end is a plain YYYY-MM-DD date. formatDate would parse it as UTC
// midnight and show the previous day in negative-offset timezones, so build a
// local Date from the components instead.
