"use client";

import { useState } from "react";
import { BackToTyping } from "~/components/ui/back-to-typing";
import { IconBrandDiscordFilled, IconBrandGithubFilled, IconBrandGoogleFilled, IconKeyboardFilled } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { signInWithProvider, type AuthProvider } from "~/server/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  async function signIn(provider: AuthProvider) {
    setLoading(provider);
    try {
      const res = await signInWithProvider(provider);
      if (!res.url) {
        toast.error(res.error ?? "auth unavailable");
        setLoading(null);
        return;
      }
      window.location.href = res.url;
    } catch {
      toast.error("failed to start sign-in");
      setLoading(null);
    }
  }

  const providers: { id: AuthProvider; label: string; icon: typeof IconBrandGithubFilled }[] = [
    { id: "github", label: "Continue with GitHub", icon: IconBrandGithubFilled },
    { id: "google", label: "Continue with Google", icon: IconBrandGoogleFilled },
    { id: "discord", label: "Continue with Discord", icon: IconBrandDiscordFilled },
  ];

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="relative w-full max-w-sm">
        {/* Background glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2">
          <div className="size-64 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative flex flex-col items-center gap-8">
          {/* Logo + heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">welcome to</p>
              <h1 className="flex items-center justify-center gap-2 text-xl font-semibold tracking-tight">
                <IconKeyboardFilled className="text-primary size-6" />
                zentype
              </h1>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              keep your stats across devices.<br />
              sign in to sync, or keep playing as a guest.
            </p>
          </div>

          {/* Sign in buttons */}
          <div className="flex w-full flex-col gap-2.5">
            {providers.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant="outline"
                size="lg"
                onClick={() => signIn(id)}
                disabled={loading !== null}
                className="w-full justify-center gap-3 text-sm"
              >
                <Icon className="size-4" />
                {loading === id ? "Redirecting…" : label}
              </Button>
            ))}
          </div>

          {/* Back link */}
          <BackToTyping />
        </div>
      </div>
    </div>
  );
}
