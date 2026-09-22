import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members | Powerzone Fitness",
};

export default function MembersPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
        Members
      </h1>
      <div className="mt-3 h-px w-16 bg-neutral-300 dark:bg-neutral-700" />
      <p className="mt-4 text-neutral-500 dark:text-neutral-400">
        Manage all registered gym members.
      </p>
    </div>
  );
}