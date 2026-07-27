import Link from "next/link"
import { PawPrint } from "lucide-react"

export const metadata = {
  title: "Privacy Policy | GroomingPro",
  description: "How GroomingPro collects, uses, and protects your data.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
              <PawPrint className="h-4 w-4" />
            </div>
            <span className="font-bold text-lg">GroomingPro</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">← Back to Home</Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 27, 2026</p>

        <div className="prose prose-amber max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              GroomingPro (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is a pet grooming salon management SaaS
              operated by Winter Math. We respect your privacy and are committed to protecting your personal data.
              This policy explains how we collect, use, and safeguard your information when you use our website
              at <Link href="https://www.petsalonos.com" className="text-primary hover:underline">petsalonos.com</Link> and related services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Account Information:</strong> Email, password (hashed), shop name, address, phone number.</li>
              <li><strong>Business Data:</strong> Customer records, pet profiles, appointment history, service catalogs that you create in the app.</li>
              <li><strong>Payment Information:</strong> Processed by Creem (our Merchant of Record). We do not store your credit card details — Creem handles all payment data securely.</li>
              <li><strong>Usage Data:</strong> IP address, browser type, pages visited, feature usage patterns for analytics and security.</li>
              <li><strong>Email Communications:</strong> Appointment confirmations and reminders sent via Resend.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>To provide and maintain the GroomingPro service</li>
              <li>To send appointment confirmations and reminders to you and your customers</li>
              <li>To process subscription payments via Creem</li>
              <li>To provide AI-powered features (scheduling, churn prediction, analytics) using DeepSeek API</li>
              <li>To notify you about important updates, security alerts, or product changes</li>
              <li>To detect, prevent, and address technical issues, fraud, or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. Data Storage &amp; Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your data is stored in Supabase (PostgreSQL) hosted on secure cloud infrastructure. We use
              Row-Level Security (RLS) to ensure each salon can only access its own data. All data in transit
              is encrypted via TLS/SSL. Payment data is handled exclusively by Creem and never touches our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Third-Party Services</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Creem:</strong> Payment processing (Merchant of Record) — <Link href="https://creem.io/privacy" className="text-primary hover:underline">creem.io/privacy</Link></li>
              <li><strong>Supabase:</strong> Database hosting and authentication — <Link href="https://supabase.com/privacy" className="text-primary hover:underline">supabase.com/privacy</Link></li>
              <li><strong>Resend:</strong> Transactional email delivery — <Link href="https://resend.com/privacy" className="text-primary hover:underline">resend.com/privacy</Link></li>
              <li><strong>DeepSeek:</strong> AI language model for analytics and content features</li>
              <li><strong>Vercel:</strong> Web hosting and CDN — <Link href="https://vercel.com/legal/privacy-policy" className="text-primary hover:underline">vercel.com/legal/privacy-policy</Link></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your data for as long as your account is active. If you cancel your subscription,
              we keep your data for 30 days to allow for reactivation, then permanently delete it.
              You may request immediate deletion at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Your Rights (GDPR / CCPA)</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data (&quot;right to be forgotten&quot;)</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent for data processing at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              To exercise these rights, email us at <a href="mailto:support@petsalonos.com" className="text-primary hover:underline">support@petsalonos.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">8. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use essential cookies for authentication and session management. We do not use third-party
              advertising cookies. Analytics cookies (if any) are optional and can be disabled in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">9. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              GroomingPro is a B2B service for pet grooming business owners. We do not knowingly collect data
              from children under 16. If you believe we have collected data from a minor, please contact us
              immediately for deletion.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For privacy questions or data requests, contact us at:
              <br />
              📧 <a href="mailto:support@petsalonos.com" className="text-primary hover:underline">support@petsalonos.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this policy from time to time. We will notify you of significant changes via email
              or an in-app notification. The &quot;Last updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}