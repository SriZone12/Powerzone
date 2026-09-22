import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Powerzone Fitness",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
          Login
        </h1>
        <div className="mx-auto mt-3 h-px w-12 bg-neutral-300 dark:bg-neutral-700" />
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Sign in to the Powerzone Fitness admin panel.
        </p>
      </div>
    </main>
  );
}