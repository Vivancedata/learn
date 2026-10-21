import type { Metadata } from 'next'
import Link from 'next/link'
import { AnalyticsConsentControl } from './analytics-consent-control'

export const metadata: Metadata = {
  title: 'Privacy Policy | Vivancedata',
  description: 'What Vivancedata Learn collects, why, who processes it, and how to get it deleted.',
}

const LAST_UPDATED = 'October 20, 2026'
const CONTACT = 'support@vivancedata.com'

/**
 * Written from what the code does, not from a template. When a data flow
 * changes (a new processor, a new analytics setting, Sentry sample rates in
 * sentry.client.config.ts, PostHog options in posthog-provider.tsx), update
 * this page in the same pull request.
 */
export default function PrivacyPage() {
  return (
    <article className="prose prose-slate dark:prose-invert mx-auto max-w-3xl py-8">
      <h1>Privacy Policy</h1>
      <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <p>
        Vivancedata Learn (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the learning platform at
        learn.vivancedata.com, run by Vivancedata. This page explains what we collect, why,
        which companies process it for us, and what you can ask us to do with it. Questions go
        to <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>

      <h2>What we collect</h2>

      <h3>Your account</h3>
      <p>
        When you sign up we store your email address, your name if you give one, your GitHub
        username if you add one, and your password as a bcrypt hash (we never store or see the
        password itself). We record whether you have verified your email.
      </p>

      <h3>Your learning activity</h3>
      <p>
        To run the courses we store your progress through lessons, courses and learning paths,
        quiz and assessment answers and scores, XP, levels, streaks, achievements and
        certificates. If you post in discussions, submit a project or give community points, we
        store that content.
      </p>

      <h3>AI tutor conversations</h3>
      <p>
        If you use the AI tutor, we store your conversations so you can return to them, and count
        your messages per day to apply the daily limit. Each message, with the lesson context it
        relates to, is sent to an AI model provider to generate the reply: Anthropic (Claude) by
        default, or OpenAI if Anthropic is unavailable. Don&rsquo;t put personal or sensitive
        information in tutor messages.
      </p>

      <h3>Payments</h3>
      <p>
        If you buy a subscription, Stripe handles checkout and stores your payment details; we
        never see or store your full card number. We store your Stripe customer and subscription
        IDs, the plan, its status and billing-period dates, and a log of the Stripe webhook events
        that update them.
      </p>

      <h3>Emails and notifications</h3>
      <p>
        We send account emails (verification, password reset) through Resend, and store the
        delivery events Resend reports back. If you turn on push notifications, we store the push
        subscription your browser gives us so we can send them, and your notification
        preferences.
      </p>

      <h3>Technical data</h3>
      <ul>
        <li>
          <strong>Sign-in cookie.</strong> An HTTP-only <code>auth-token</code> cookie keeps you
          signed in for up to 7 days. It is required for the site to work.
        </li>
        <li>
          <strong>Rate limiting.</strong> To stop abuse, requests are counted per IP address (and
          per account for some actions) in a short-lived store (Upstash Redis, or server memory
          if Redis is unavailable). The counters expire within minutes.
        </li>
        <li>
          <strong>Error monitoring.</strong> We use Sentry to find and fix errors. When something
          breaks, Sentry receives the error, your browser and device type, the page, and, if you
          are signed in, your account ID, email and name. When an error happens in your browser,
          Sentry may also keep a replay of the moments before it, with all text and form inputs
          masked and images blocked. We do not record sessions where no error occurs. The
          &ldquo;Report an Issue&rdquo; button sends Sentry whatever you write in it.
        </li>
      </ul>

      <h2>Analytics</h2>
      <p>
        We use PostHog to understand which pages and lessons get used. In your browser, PostHog
        does not load until you choose <em>Allow</em> in the analytics banner. With your consent
        it sets a cookie and local storage entry, and records page views, clicks and the page you
        came from, never what you type into fields, and never a recording of your session. If you
        are signed in, those events are linked to your account ID, email and name. If your browser
        sends Do Not Track, PostHog does not capture anything even after you allow it.
      </p>
      <p>
        Separately, our servers send PostHog a small set of learning events (lesson completed,
        quiz completed, project submitted, streak and level changes) linked to your account ID,
        not your email, so we can see how courses are used. These do not depend on the browser
        banner.
      </p>
      <AnalyticsConsentControl />

      <h2>Who processes your data</h2>
      <p>We use these companies to run the service. Each processes data only to provide its part:</p>
      <ul>
        <li><strong>Vercel</strong>: hosting and serving the site</li>
        <li><strong>A managed PostgreSQL provider</strong>: our database</li>
        <li><strong>Upstash</strong>: rate-limit counters</li>
        <li><strong>Stripe</strong>: payments and billing</li>
        <li><strong>Resend</strong>: account emails</li>
        <li><strong>Sentry</strong>: error monitoring</li>
        <li><strong>PostHog</strong>: product analytics</li>
        <li><strong>Anthropic and OpenAI</strong>: AI tutor replies</li>
      </ul>
      <p>
        Some of these companies are in the United States, so your data may be processed there. We
        do not sell your personal information or share it for advertising.
      </p>

      <h2>What others can see</h2>
      <p>
        Your name appears on the public leaderboard unless you ask us to hide it. Discussion posts,
        replies and submitted projects are visible to other learners. A certificate&rsquo;s
        verification code shows your name and the course to anyone who looks it up.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your account and learning data while your account exists. Billing records may be
        kept longer where tax or accounting rules require it. Sign-in cookies last up to 7 days,
        and rate-limit counters last minutes. Error and analytics data is kept for the retention
        period of our Sentry and PostHog plans.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>Change your name and profile details in Settings.</li>
        <li>Allow or refuse browser analytics with the control above.</li>
        <li>Turn push notifications off in Settings or in your browser.</li>
        <li>
          Email <a href={`mailto:${CONTACT}`}>{CONTACT}</a> to get a copy of your data, correct it,
          remove your name from the leaderboard, or delete your account. Deletion removes your
          account and the learning data linked to it; we will confirm by email.
        </li>
      </ul>
      <p>
        Depending on where you live (for example the EU, the UK or California), you may have
        further rights, including to object to processing or to complain to a data protection
        authority. Contact us first and we will help.
      </p>

      <h2>Children</h2>
      <p>
        The platform is not meant for children under 13, and we do not knowingly collect their
        data. If you believe a child has signed up, contact us and we will delete the account.
      </p>

      <h2>Changes</h2>
      <p>
        If we change how we handle data, we will update this page and the date above. For
        significant changes we will tell signed-in users by email or on the site.
      </p>

      <p>
        See also the <Link href="/terms">Terms of Service</Link>.
      </p>
    </article>
  )
}
