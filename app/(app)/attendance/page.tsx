"use client";

import { useEffect, useMemo, useState } from "react";
import { FormEvent } from "react";
import { CalendarDays, UserPlus, Users, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white";

type ActiveMember = {
  id: string;
  full_name: string | null;
};

type TodayRow = {
  check_in_time: string | null;
  members: { full_name: string | null } | null;
};

function toTodayRows(rows: unknown[]): TodayRow[] {
  return rows.map((row) => {
    const r = row as {
      check_in_time: string | null;
      members:
        | { full_name: string | null }
        | { full_name: string | null }[]
        | null;
    };
    const member = Array.isArray(r.members) ? r.members[0] : r.members;
    return { check_in_time: r.check_in_time, members: member ?? null };
  });
}

export default function AttendancePage() {
  const today = useMemo(() => {
    const now = new Date();
    return {
      date: formatLocalDate(now),
      display: now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }, []);

  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [todayRows, setTodayRows] = useState<TodayRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [todayLoading, setTodayLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [membersRes, todayRes] = await Promise.all([
        supabase
          .from("members")
          .select("id, full_name")
          .eq("status", "active")
          .order("full_name"),
        supabase
          .from("attendance")
          .select("check_in_time, members(full_name)")
          .eq("date", today.date)
          .order("check_in_time"),
      ]);

      if (cancelled) return;

      if (membersRes.error) setMembersError(friendlyError(membersRes.error.code));
      else setActiveMembers(membersRes.data ?? []);

      if (todayRes.error) setTodayError(friendlyError(todayRes.error.code));
      else setTodayRows(toTodayRows(todayRes.data ?? []));

      setMembersLoading(false);
      setTodayLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [today.date]);

  async function loadToday() {
    const { data, error } = await supabase
      .from("attendance")
      .select("check_in_time, members(full_name)")
      .eq("date", today.date)
      .order("check_in_time");

    if (error) {
      setTodayError(friendlyError(error.code));
      return;
    }
    setTodayError(null);
    setTodayRows(toTodayRows(data ?? []));
  }

  async function handleMark(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    if (!selectedMemberId) {
      setActionError("Please select a member first.");
      return;
    }

    setSaving(true);
    const existing = await supabase
      .from("attendance")
      .select("id")
      .eq("member_id", selectedMemberId)
      .eq("date", today.date);

    if (existing.data && existing.data.length > 0) {
      setSaving(false);
      setActionError("This member has already marked attendance today.");
      return;
    }

    const { error } = await supabase.from("attendance").insert({
      member_id: selectedMemberId,
      date: today.date,
      check_in_time: new Date().toISOString(),
    });
    setSaving(false);

    if (error) {
      const duplicate =
        error.code === "23505" || /duplicate|already exists/i.test(error.message);
      setActionError(
        duplicate
          ? "This member has already marked attendance today."
          : friendlyError(error.code)
      );
      return;
    }

    setSelectedMemberId("");
    setActionSuccess("Attendance marked successfully.");
    await loadToday();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
        Attendance
      </h1>
      <div className="mt-3 h-px w-16 bg-neutral-300 dark:bg-neutral-700" />
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        Track member check-ins and attendance records.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-neutral-700 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300">
        <CalendarDays className="h-4 w-4 text-neutral-400" />
        {today.display}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section className="rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur lg:col-span-2 dark:border-neutral-800 dark:bg-neutral-900/80">
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
            <UserPlus className="h-4 w-4 text-neutral-400" />
            Mark Attendance
          </h2>

          {actionSuccess && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
              {actionError}
            </div>
          )}

          <form onSubmit={handleMark} className="mt-4 flex flex-col gap-3">
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              disabled={saving || membersLoading}
              className={inputClass}
              aria-label="Select member"
            >
              <option value="">Select a member…</option>
              {activeMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={saving || !selectedMemberId}
              className="flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              {saving && !actionError && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white dark:border-neutral-400 dark:border-t-neutral-900" />
              )}
              {saving ? "Marking…" : "Mark Attendance"}
            </button>
          </form>

          {membersError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400">{membersError}</p>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur lg:col-span-3 dark:border-neutral-800 dark:bg-neutral-900/80">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-white">
              <Users className="h-4 w-4 text-neutral-400" />
              Today&apos;s Attendance
            </h2>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {todayRows.length} present
            </span>
          </div>

          {todayLoading ? (
            <div className="flex items-center justify-center gap-3 px-6 py-12">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900 dark:border-neutral-600 dark:border-t-white" />
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Loading attendance…
              </p>
            </div>
          ) : todayError ? (
            <p className="px-6 py-12 text-center text-sm text-red-600 dark:text-red-400">
              Failed to load today&apos;s attendance: {todayError}
            </p>
          ) : todayRows.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                No check-ins yet today
              </p>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Members who mark attendance will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100 dark:divide-neutral-800">
              {todayRows.map((row, i) => (
                <li
                  key={`${row.members?.full_name ?? "member"}-${i}`}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-white dark:text-neutral-900">
                      {(row.members?.full_name ?? "?")
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </span>
                    <span className="font-medium text-neutral-900 dark:text-white">
                      {row.members?.full_name ?? "Unknown member"}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                    <Clock className="h-4 w-4" />
                    {row.check_in_time ? displayTime(row.check_in_time) : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}