import type { Metadata } from 'next'
import Link from 'next/link'
import { isProTierEnabled } from '@/lib/pro-tier'

export const metadata: Metadata = {
  title: 'Terms of Service | Vivancedata',
  description: 'The terms for using Vivancedata Learn.',
}

const LAST_UPDATED = 'October 20, 2026'
const CONTACT = 'support@vivancedata.com'

export default function TermsPage() {
  const proEnabled = isProTierEnabled()

  return (
    <article className="prose prose-slate dark:prose-invert mx-auto max-w-3xl py-8">
      <h1>Terms of Service</h1>
      <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

      <p>
        These terms cover your use of Vivancedata Learn at learn.vivancedata.com (the
        &ldquo;service&rdquo;), run by Vivancedata (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By creating
        an account or using the service you agree to them. Our{' '}
        <Link href="/privacy">Privacy Policy</Link> explains how we handle your data.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>You must be at least 13 years old to create an account.</li>
        <li>
          Give a real email address and keep your password to yourself. You are responsible for
          what happens under your account.
        </li>
        <li>One person per account. Don&rsquo;t share accounts or create accounts automatically.</li>
      </ul>

      <h2>Using the service</h2>
      <p>Don&rsquo;t:</p>
      <ul>
        <li>post anything unlawful, abusive, harassing, or that infringes someone else&rsquo;s rights;</li>
        <li>post spam or advertising in discussions or project submissions;</li>
        <li>
          try to break, overload or get around the service&rsquo;s security, rate limits or
          access controls, or scrape it in bulk;
        </li>
        <li>game the leaderboard, XP, streaks or community points with fake activity or accounts;</li>
        <li>share assessment questions or answers.</li>
      </ul>
      <p>
        We may remove content or suspend accounts that break these rules. Where it is reasonable,
        we will tell you why.
      </p>

      <h2>Your content</h2>
      <p>
        You keep ownership of what you post: discussion posts, replies, code and project
        submissions. You give us permission to store it and show it to other users of the service
        as part of how the service works (for example, discussions and student solutions are
        visible to other learners). That permission ends when you delete the content or your
        account, except for copies other users have already quoted in their own posts.
      </p>

      <h2>Course content</h2>
      <p>
        Courses, lessons, quizzes, assessments and other material on the service belong to us or
        our licensors. You may use them for your own learning. Don&rsquo;t republish or sell them.
      </p>

      <h2>The AI tutor</h2>
      <p>
        The AI tutor generates answers with third-party AI models. Its answers can be wrong or
        incomplete; check anything important before relying on it. Don&rsquo;t send it personal or
        sensitive information. Free accounts have a daily message limit.
      </p>

      <h2>Certificates</h2>
      <p>
        Certificates record that an account completed a course on this service. They are not
        accredited qualifications.
      </p>

      <h2>Paid plans</h2>
      {proEnabled ? (
        <>
          <p>
            Pro is a subscription billed in advance, monthly or yearly, through Stripe. It renews
            automatically until you cancel. You can cancel at any time from Settings, which opens
            the Stripe billing portal; you keep Pro until the end of the period you have already
            paid for. We don&rsquo;t give partial refunds for unused time, but if something went
            wrong, contact us at <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. We will tell you in
            advance before changing the price of an active subscription.
          </p>
          <p>
            Your statutory rights as a consumer, including any right to cancel under the law where
            you live, are not affected.
          </p>
        </>
      ) : (
        <p>
          The service is currently free. There is no paid plan on sale. If we introduce one, these
          terms will be updated to describe billing, renewal and cancellation before anyone can buy
          it.
        </p>
      )}

      <h2>Availability and changes</h2>
      <p>
        We work to keep the service running and accurate, but we provide it &ldquo;as is&rdquo;,
        without guarantees that it will always be available, error-free or fit for a particular
        purpose. We may change, add or remove courses and features.
      </p>

      <h2>Liability</h2>
      <p>
        To the extent the law allows, we are not liable for indirect or consequential losses, or
        for loss of data, profits or opportunities, arising from your use of the service. Our total
        liability to you for any claim is limited to the amount you paid us in the 12 months before
        the claim, or USD 50 if you paid nothing. Nothing in these terms limits liability that
        cannot be limited by law.
      </p>

      <h2>Ending your account</h2>
      <p>
        You can stop using the service at any time and ask us to delete your account by emailing{' '}
        <a href={`mailto:${CONTACT}`}>{CONTACT}</a>. We may suspend or close accounts that break
        these terms.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms. We will change the date above, and for significant changes we
        will tell signed-in users by email or on the site before they take effect. If you keep
        using the service after that, the new terms apply.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${CONTACT}`}>{CONTACT}</a>.
      </p>
    </article>
  )
}
