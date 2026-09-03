import type { Metadata } from "next";
import { BackToTyping } from "~/components/ui/back-to-typing";
import { InlineCode } from "~/components/ui/inline-code";
import { IconArrowRight, IconFileTextFilled, IconKeyboardFilled } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "terms of service",
  description: "Terms of Service for zentype",
};

export default function TermsPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <IconFileTextFilled className="text-primary size-5" /> terms of service
        </h1>
      </header>

      <div className="space-y-8">
        <section>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Welcome to <strong><IconKeyboardFilled className="text-primary size-3.5 inline" /> zentype</strong> (&quot;Service&quot;), operated by{" "}
            <a href="https://cmmhero.top" target="_blank" rel="noreferrer" className="text-primary hover:underline">
              CMMhero
            </a>
            . By accessing or using <IconKeyboardFilled className="text-primary size-3.5 inline" /> zentype, you agree to these Terms. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">1. use of the service</h2>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>You must be at least 13 years old to create an account.</li>
            <li>You are responsible for activity under your account and for keeping credentials secure.</li>
            <li>Do not abuse, scrape, or attempt to disrupt the Service or its leaderboards.</li>
            <li>Typing results are subject to a server-side plausibility check; implausible results may be rejected.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">2. accounts & data</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Authentication is via <InlineCode>Supabase Auth</InlineCode> (<InlineCode>GitHub</InlineCode>, <InlineCode>Google</InlineCode>, or <InlineCode>Discord</InlineCode> OAuth). Profiles store your username and avatar. Test results, XP, achievements, and settings are tied to your user ID and protected by <InlineCode>Row Level Security</InlineCode>. You may export your data (Settings <IconArrowRight className="text-muted-foreground size-3 inline" /> Your data) or delete your account entirely (Settings <IconArrowRight className="text-muted-foreground size-3 inline" /> Danger Zone or the command palette, with a typed confirmation).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">3. content</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            Test text comes from a built-in English word list; prompts are generated on the fly and nothing you type is mined for content. Leaderboards reflect user-submitted results and are not editorial content. You retain rights to your typing data; you grant us a license to store and display it as part of the Service (e.g., leaderboards, profiles).
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">4. acceptable use</h2>
          <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
            <li>No cheating tools, bots, or automated input.</li>
            <li>No harassment, impersonation, or unlawful content.</li>
            <li>We may remove abusive accounts or entries.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold">5. disclaimer</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            The Service is provided &quot;as is&quot; without warranties. We do not guarantee uptime, accuracy of stats, or preservation of data. Use at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">6. changes</h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            We may update these Terms. Continued use after changes constitutes acceptance. Material changes will be noted via the app or GitHub.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">7. contact</h2>
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
          <BackToTyping />
        </div>
      </div>
    </div>
  );
}
