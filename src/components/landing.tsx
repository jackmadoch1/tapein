import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";

export function Landing() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="bg-primary">
        <div className="mx-auto flex h-14 max-w-lg items-center px-4">
          <BrandMark />
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-16">
        <h1 className="font-display text-5xl tracking-tight">AT Room</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Check in when you go in. Two teammates confirm it. The board counts
          the week.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Create an account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link to="/login" search={{ mode: "signin" }}>
              Sign in
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
