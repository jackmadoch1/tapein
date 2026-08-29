import { useEffect } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { ensureProfile } from "@/lib/tapein";
import { BrandMark } from "@/components/brand-mark";

export function AppShell({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();

  useEffect(() => {
    if (!user) return;
    const displayName =
      user.displayName?.trim() ||
      user.primaryEmail?.split("@")[0] ||
      "Athlete";
    void ensureProfile({ data: { displayName } }).catch(() => undefined);
  }, [user]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between gap-3 px-4">
          <BrandMark />
          <div className="header-user max-w-[55vw] overflow-hidden">
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-5">{children}</main>
    </div>
  );
}
