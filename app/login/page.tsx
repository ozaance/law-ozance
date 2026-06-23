import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-xl font-semibold text-accent-foreground shadow-[var(--shadow-md)]">
          §
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">LexFlow</h1>
        <p className="mt-1 text-sm text-muted">
          Connectez-vous à votre cabinet
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
