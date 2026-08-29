import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | zentype",
  description: "Terms of Service for zentype",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">terms of service</h1>
      <p className="text-muted-foreground mt-2 text-xs">Last updated: August 29, 2026</p>

      <div className="mt-8 space-y-8">
        <section>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Welcome to <strong>zentype</strong> (&quot;Service&quot;), operated by{" "}
            <a href="https://cmmhero.top" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              CMMhero
            </a>
            . By accessing or using zentype, you agree to these Terms. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">1. Use of the Service</h2>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>You must be at least 13 years old to create an account.</li>
            <li>You are responsible for activity under your account and for keeping credentials secure.</li>
            <li>Do not abuse, scrape, or attempt to disrupt the Service, leaderboards, or rate limits.</li>
            <li>Typing results are subject to a server-side plausibility check; implausible results may be rejected.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">2. Accounts & Data</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Authentication is via Supabase Auth (GitHub/Google OAuth). Profiles store your username and avatar. Test results, XP, achievements, and settings are tied to your user ID and protected by Row Level Security. You may export your data (Settings → Your data) or delete all results via the Danger Zone.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">3. Content</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Prompts are sourced from offline word lists and optional external providers. Leaderboards reflect user-submitted results and are not editorial content. You retain rights to your typing data; you grant us a license to store and display it as part of the Service (e.g., leaderboards, profiles).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">4. Acceptable Use</h2>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>No cheating tools, bots, or automated input.</li>
            <li>No harassment, impersonation, or unlawful content.</li>
            <li>We may rate-limit, shadow-filter, or remove abusive accounts or entries.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">5. Disclaimer</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            The Service is provided &quot;as is&quot; without warranties. We do not guarantee uptime, accuracy of stats, or preservation of data. Use at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">6. Changes</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            We may update these Terms. Continued use after changes constitutes acceptance. Material changes will be noted via the app or GitHub.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">7. Contact</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Questions? Visit{" "}
            <a href="https://cmmhero.top" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              cmmhero.top
            </a>{" "}
            or email{" "}
            <a href="mailto:contact@cmmhero.top" className="text-primary hover:underline">
              contact@cmmhero.top
            </a>
            .
          </p>
        </section>

        <div className="pt-4">
          <Link href="/" className="text-primary text-xs underline underline-offset-2">
            ← back to test
          </Link>
        </div>
      </div>
    </div>
  );
}
