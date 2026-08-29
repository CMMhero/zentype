import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | zentype",
  description: "Privacy Policy for zentype",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground mt-2 text-xs">Last updated: August 29, 2026</p>

      <div className="prose prose-sm dark:prose-invert mt-8 max-w-none prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm">
        <p>
          <strong>zentype</strong> is built by <a href="https://cmmhero.top" className="underline underline-offset-2">CMMhero</a>. We collect only what is needed to run the Service. This policy explains what we collect, how we use it, and your choices.
        </p>

        <h2 className="text-base font-semibold mt-6">1. Data we collect</h2>
        <ul className="list-disc pl-5">
          <li><strong>Account</strong>: email, username, avatar URL via Supabase Auth (GitHub/Google OAuth). Stored in <code>profiles</code>.</li>
          <li><strong>Typing results</strong>: WPM, accuracy, consistency, chars, timeline, mode/variant, timestamp in <code>test_results</code>.</li>
          <li><strong>Gamification</strong>: XP, level, achievements, streaks in <code>user_points</code>/<code>point_events</code>/<code>user_achievements</code>.</li>
          <li><strong>Settings</strong>: theme, font, gameplay prefs in <code>user_settings</code> (jsonb).</li>
          <li><strong>Local</strong>: guest results and settings cached in your browser (Zustand + localStorage) before login.</li>
          <li><strong>Operational</strong>: Upstash Redis for leaderboards and rate limiting; no third-party analytics.</li>
        </ul>

        <h2 className="text-base font-semibold mt-6">2. How we use data</h2>
        <p>
          We use your data to log you in, save your typing results, show leaderboards and profiles, and remember your settings. We do not sell your data or show ads.
        </p>

        <h2 className="text-base font-semibold mt-6">3. Sharing</h2>
        <p>
          Your profile and leaderboard rankings are public. We use Supabase and Upstash to run the app. We do not share data with advertisers.
        </p>

        <h2 className="text-base font-semibold mt-6">4. Retention & deletion</h2>
        <p>
          Data is retained while your account exists. You can export JSON or delete all results in Settings → Danger Zone (deletes <code>test_results</code> for your user). Account deletion removes related rows via cascade.
        </p>

        <h2 className="text-base font-semibold mt-6">5. Security</h2>
        <p>
          Postgres Row Level Security restricts reads/writes to your own rows. Auth uses PKCE with httpOnly cookies. Redis entries expire after 1 year. No system is 100% secure; report issues via GitHub.
        </p>

        <h2 className="text-base font-semibold mt-6">6. Your rights</h2>
        <p>
          Access, export, or delete your data in-app. Contact us to request account deletion or with questions.
        </p>

        <h2 className="text-base font-semibold mt-6">7. Changes</h2>
        <p>We may update this policy; material changes will be noted in-app or on GitHub. Continued use means acceptance.</p>

        <h2 className="text-base font-semibold mt-6">8. Contact</h2>
        <p>
          Visit <a href="https://cmmhero.top" className="underline underline-offset-2">cmmhero.top</a> or email <a href="mailto:contact@cmmhero.top" className="underline underline-offset-2">contact@cmmhero.top</a>.
        </p>

        <p className="mt-8">
          <Link href="/" className="text-primary text-xs underline underline-offset-2">← Back to test</Link>
        </p>
      </div>
    </div>
  );
}
