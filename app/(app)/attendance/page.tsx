import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Attendance | Powerzone Fitness",
};

export default function AttendancePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
        Attendance
      </h1>
      <div className="mt-3 h-px w-16 bg-neutral-300 dark:bg-neutral-700" />
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        Track member check-ins and attendance records.
      </p>
    </div>
  );
}