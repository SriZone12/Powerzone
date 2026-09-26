// Shared Tailwind class strings so form controls stay visually identical
// across pages. These were copy-pasted per page; keep them here instead.

export const inputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:focus:ring-white";

export const primaryButtonClass =
  "flex items-center justify-center gap-2 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-300";

export const secondaryButtonClass =
  "rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800";
