"use client";

import { useState } from "react";
import { IconBrandGithub, IconBrandGoogle } from "@tabler/icons-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Kbd } from "~/components/ui/kbd";
import { signInWithProvider } from "~/server/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState<"github" | "google" | null>(null);

  async function signIn(provider: "github" | "google") {
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

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">
            zentype login
          </CardTitle>
          <CardDescription>
            sync stats across devices · climb global leaderboards.
            <br />
            guests can always keep playing — results stay on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button variant="outline" size="lg" onClick={() => signIn("github")} disabled={loading !== null} className="justify-start gap-3">
            <IconBrandGithub className="size-4" />
            {loading === "github" ? "redirecting…" : "continue with github"}
          </Button>
          <Button variant="outline" size="lg" onClick={() => signIn("google")} disabled={loading !== null} className="justify-start gap-3">
            <IconBrandGoogle className="size-4" />
            {loading === "google" ? "redirecting…" : "continue with google"}
          </Button>
          <p className="text-muted-foreground mt-2 text-center text-[11px]">
            press <Kbd>esc</Kbd> or go back to keep typing as guest
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
