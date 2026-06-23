import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-navy.png" alt="Ozance" width={44} className="mb-4 h-11 w-auto dark:hidden" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/ozance-mark-gold.png" alt="Ozance" width={44} className="mb-4 hidden h-11 w-auto dark:block" />
        <h1 className="text-2xl font-semibold tracking-tight">Ozance</h1>
        <p className="mt-1 text-sm text-muted">Créez votre compte</p>
      </div>
      <SignupForm next={next} />
    </main>
  );
}
