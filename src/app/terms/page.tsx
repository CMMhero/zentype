import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | zentype",
  description: "Terms of Service for zentype",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
      <p className="text-muted-foreground mt-2 text-xs">Last updated: August 28, 2026</p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm">
        <p>
          Welcome to <strong>zentype</strong> (“Service”), operated by <a href="https://cmmhero.top" className="underline underline-offset-2">CMMhero</a>. By accessing or using zentype, you agree to these Terms. If you do not agree, do not use the Service.
        </p>

        <h2 className="text-base font-semibold mt-6">1. Use of the Service</h2>
        <ul className="list-disc pl-5">
          <li>You must be at least 13 years old to create an account.</li>
          <li>You are responsible for activity under your account and for keeping credentials secure.</li>
          <li>Do not abuse, scrape, or attempt to disrupt the Service, leaderboards, or rate limits.</li>
          <li>Typing results are subject to a server-side plausibility check; implausible results may be rejected.</li>
        </ul>

        <h2 className="text-base font-semibold mt-6">2. Accounts & Data</h2>
        <p>
          Authentication is via Supabase Auth (GitHub/Google OAuth). Profiles store your username and avatar. Test results, XP, achievements, and settings are tied to your user ID and protected by Row Level Security. You may export your data (Settings → Your data) or delete all results via the Danger Zone.
        </p>

        <h2 className="text-base font-semibold mt-6">3. Content</h2>
        <p>
          Prompts are sourced from offline word lists and optional external providers. Leaderboards reflect user-submitted results and are not editorial content. You retain rights to your typing data; you grant us a license to store and display it as part of the Service (e.g., leaderboards, profiles).
        </p>

        <h2 className="text-base font-semibold mt-6">4. Acceptable Use</h2>
        <ul className="list-disc pl-5">
          <li>No cheating tools, bots, or automated input.</li>
          <li>No harassment, impersonation, or unlawful content.</li>
          <li>We may rate-limit, shadow-filter, or remove abusive accounts or entries.</li>
        </ul>

        <h2 className="text-base font-semibold mt-6">5. Disclaimer</h2>
        <p>
          The Service is provided “as is” without warranties. We do not guarantee uptime, accuracy of stats, or preservation of data. Use at your own risk.
        </p>

        <h2 className="text-base font-semibold mt-6">6. Changes</h2>
        <p>
          We may update these Terms. Continued use after changes constitutes acceptance. Material changes will be noted via the app or GitHub.
        </p>

        <h2 className="text-base font-semibold mt-6">7. Contact</h2>
        <p>
          Questions? Visit <a href="https://cmmhero.top" className="underline underline-offset-2">cmmhero.top</a> or email <a href="mailto:contact@cmmhero.top" className="underline underline-offset-2">contact@cmmhero.top</a>.
        </p>

        <p className="mt-8">
          <Link href="/" className="text-primary text-xs underline underline-offset-2">← Back to test</Link>
        </p>
      </div>
    </div>
  );
}
