"use client";

import { useState } from "react";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MEMBERSHIP_PLANS as PLANS } from "@/lib/plans";
import { friendlyError } from "@/lib/errors";

const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:border-white";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function AddMemberPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("1-month");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("Full Name is required.");
      return;
    }
    if (!startDate) {
      setError("Membership Start Date is required.");
      return;
    }

    const plan = PLANS.find((p) => p.id === planId)!;
    const endDate = addMonths(startDate, plan.months);

    setSubmitting(true);
    const { error } = await supabase.from("members").insert({
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      membership_plan: plan.label,
      membership_start: startDate,
      status: "active",
      membership_end: endDate,
    });
    setSubmitting(false);

    if (error) {
      setError(friendlyError(error.code));
      return;
    }

    setSuccess("Member added successfully. Redirecting…");
    window.setTimeout(() => router.push("/members"), 900);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
        Add Member
      </h1>
      <div className="mt-3 h-px w-16 bg-neutral-300 dark:bg-neutral-700" />
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        Add a new member to the gym.
      </p>

      <div className="mt-6 max-w-xl rounded-2xl border border-neutral-200 bg-white/80 p-6 backdrop-blur sm:p-8 dark:border-neutral-800 dark:bg-neutral-900/80">
        {success && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Field label="Full Name" htmlFor="full-name" required>
            <input
              id="full-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g., Ram Shrestha"
              disabled={submitting}
              className={inputClass}
            />
          </Field>

          <Field label="Phone" htmlFor="phone">
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+977 98XXXXXXXX"
              disabled={submitting}
              className={inputClass}
            />
          </Field>

          <Field label="Email" htmlFor="email">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g., ram.shrestha@gmail.com"
              disabled={submitting}
              className={inputClass}
            />
          </Field>

          <Field label="Membership Plan" htmlFor="plan">
            <select
              id="plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              disabled={submitting}
              className={inputClass}
            >
              {PLANS.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Membership Start Date" htmlFor="start-date" required>
            <CalendarPicker
              value={startDate}
              onChange={setStartDate}
              disabled={submitting}
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-400 border-t-white dark:border-neutral-400 dark:border-t-neutral-900" />
            )}
            {submitting ? "Adding…" : "Add Member"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
      >
        {label}
        {required && <span className="text-red-500 dark:text-red-400"> *</span>}
      </label>
      {children}
    </div>
  );
}

function CalendarPicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const today = new Date();
  const selected = value ? parseLocalDate(value) : null;
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({
    year: selected?.getFullYear() ?? today.getFullYear(),
    month: selected?.getMonth() ?? today.getMonth(),
  });

  function toggle() {
    if (disabled) return;
    if (!open) {
      const ref = selected ?? today;
      setView({ year: ref.getFullYear(), month: ref.getMonth() });
    }
    setOpen(!open);
  }

  function shiftMonth(delta: number) {
    setView((v) => {
      const month = v.month + delta;
      if (month < 0) return { year: v.year - 1, month: 11 };
      if (month > 11) return { year: v.year + 1, month: 0 };
      return { ...v, month };
    });
  }

  const firstWeekday = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const display = selected
    ? selected.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Select date";

  return (
    <div className="relative w-full">
      <button
        type="button"
        id="start-date"
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`${inputClass} flex w-full cursor-pointer items-center justify-between gap-2 text-left`}
      >
        <span className={selected ? "" : "text-neutral-400 dark:text-neutral-500"}>
          {display}
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-4 w-4 shrink-0 text-neutral-400"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
          <path d="M8 2.5v4M16 2.5v4M3 9h18" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-20 mt-2 w-64 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                aria-label="Previous month"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                {MONTHS[view.month]} {view.year}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((day) => (
                <span
                  key={day}
                  className="text-xs font-medium text-neutral-400 dark:text-neutral-500"
                >
                  {day}
                </span>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <span key={`empty-${i}`} />;

                const date = new Date(view.year, view.month, day);
                const iso = formatLocalDate(date);
                const isSelected = iso === value;
                const isToday =
                  date.getFullYear() === today.getFullYear() &&
                  date.getMonth() === today.getMonth() &&
                  date.getDate() === today.getDate();

                return (
                  <button
                    key={`day-${i}`}
                    type="button"
                    onClick={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    className={`h-8 w-8 rounded-full text-sm transition-colors ${
                      isSelected
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                        : `text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 ${
                            isToday ? "ring-1 ring-neutral-400 dark:ring-neutral-600" : ""
                          }`
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function parseLocalDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addMonths(startDate: string, months: number) {
  const date = parseLocalDate(startDate);
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return formatLocalDate(date);
}