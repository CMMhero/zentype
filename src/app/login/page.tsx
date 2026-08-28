"use client";

import { useState } from "react";
import Image from "next/image";
import { IconBrandDiscord, IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { signInWithProvider, type AuthProvider } from "~/server/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState<AuthProvider | null>(null);

  async function signIn(provider: AuthProvider) {
    setLoading(provider);
    try {
      const res = await signInWithProvider(provider);
      if (!res.url) {
        toast.error(res.error ?? "Auth unavailable");
        setLoading(null);
        return;
      }
      window.location.href = res.url;
    } catch {
      toast.error("Failed to start sign-in");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Image src="/logo.svg" alt="zentype" width={48} height={48} className="mx-auto mb-2" />
          <CardTitle className="text-lg">
            Welcome to zentype
          </CardTitle>
          <CardDescription>
            Sign in to save your progress and appear on leaderboards.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="outline" size="lg" onClick={() => signIn("github")} disabled={loading !== null} className="justify-start gap-3">
            <IconBrandGithub className="size-4" />
            {loading === "github" ? "Redirecting…" : "Continue with GitHub"}
          </Button>
          <Button variant="outline" size="lg" onClick={() => signIn("google")} disabled={loading !== null} className="justify-start gap-3">
            <IconBrandGoogle className="size-4" />
            {loading === "google" ? "Redirecting…" : "Continue with Google"}
          </Button>
          <Button variant="outline" size="lg" onClick={() => signIn("discord")} disabled={loading !== null} className="justify-start gap-3">
            <IconBrandDiscord className="size-4" />
            {loading === "discord" ? "Redirecting…" : "Continue with Discord"}
          </Button>

        </CardContent>
      </Card>
    </div>
  );
}
