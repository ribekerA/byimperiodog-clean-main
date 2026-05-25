import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | Login",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--surface-2)] text-[var(--text)]">
      <div className="mx-auto max-w-md py-12 px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
