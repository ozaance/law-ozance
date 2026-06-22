import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">LexFlow</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connectez-vous à votre cabinet
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
