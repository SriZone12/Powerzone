import type { Metadata } from "next";
import Image from "next/image";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Login | Powerzone Fitness",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="animate-[zoom-in_0.7s_ease-out] w-full max-w-sm rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/80">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Powerzone Fitness logo"
            width={64}
            height={64}
            priority
            className="h-16 w-16 rounded-full object-contain"
          />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Powerzone Fitness
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Sign in to the admin panel.
          </p>
        </div>
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}