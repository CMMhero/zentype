import type { Metadata } from "next";
import Link from "next/link";
import { IconLockFilled } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Privacy Policy | zentype",
  description: "Privacy Policy for zentype",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconLockFilled className="text-primary size-5" /> privacy policy
        </h1>
      </header>

      <div className="space-y-8">
        <section>
          <p className="text-muted-foreground text-sm leading-relaxed">
            <strong><IconKeyboardFilled className="text-primary size-3.5 inline" /> zentype</strong> is built by{" "}
            <a href="https://cmmhero.top" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              CMMhero
            </a>
            . We collect only what is needed to run the Service. This policy explains what we collect, how we use it, and your choices.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">1. data we collect</h2>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li><strong>Account</strong>: email, username, avatar URL via Supabase Auth (GitHub/Google OAuth). Stored in <code>profiles</code>.</li>
            <li><strong>Typing results</strong>: WPM, accuracy, consistency, chars, timeline, mode/variant, timestamp in <code>test_results</code>.</li>
            <li><strong>Gamification</strong>: XP, level, achievements, streaks in <code>user_points</code>/<code>point_events</code>/<code>user_achievements</code>.</li>
            <li><strong>Settings</strong>: theme, font, gameplay prefs in <code>user_settings</code> (jsonb).</li>
            <li><strong>Local</strong>: guest results and settings cached in your browser (Zustand + localStorage) before login.</li>
            <li><strong>Operational</strong>: Upstash Redis for leaderboards and rate limiting; no third-party analytics.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">2. how we use data</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            We use your data to log you in, save your typing results, show leaderboards and profiles, and remember your settings. We do not sell your data or show ads.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">3. sharing</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Your profile and leaderboard rankings are public. We use Supabase and Upstash to run the app. We do not share data with advertisers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">4. retention & deletion</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Data is retained while your account exists. You can export JSON or delete all results in Settings → Danger Zone (deletes <code>test_results</code> for your user). Account deletion removes related rows via cascade.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">5. security</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Postgres Row Level Security restricts reads/writes to your own rows. Auth uses PKCE with httpOnly cookies. Redis entries expire after 1 year. No system is 100% secure; report issues via GitHub.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">6. your rights</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Access, export, or delete your data in-app. Contact us to request account deletion or with questions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">7. changes</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            We may update this policy; material changes will be noted in-app or on GitHub. Continued use means acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">8. contact</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Visit{" "}
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
