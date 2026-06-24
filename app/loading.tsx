export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <span
        aria-label="Chargement"
        className="h-7 w-7 animate-spin rounded-full border-2 border-border border-t-accent"
      />
    </div>
  );
}
