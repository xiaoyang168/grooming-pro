import Link from "next/link"
import { PawPrint } from "lucide-react"

export const metadata = {
  title: "Terms of Service | GroomingPro",
  description: "The terms and conditions for using GroomingPro.",
}

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-extrabold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 27, 2026</p>

        <div className="prose prose-amber max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By creating an account or using GroomingPro (&quot;the Service&quot;), you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the Service. GroomingPro is operated
              by Winter Math.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              GroomingPro is a cloud-based pet grooming salon management SaaS that provides appointment
              scheduling, customer relationship management (CRM), AI-powered analytics, automated email
              reminders, online booking, and payment processing integration. The Service is intended for
              pet grooming businesses and professionals.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. Subscription Plans &amp; Billing</h2>
            <h3 className="font-semibold mt-3 mb-1">3.1 Plans</h3>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Starter (free 14-day trial):</strong> Up to 2 staff, online booking, customer & pet profiles, appointment calendar, email notifications.</li>
              <li><strong>Professional ($29/month):</strong> Everything in Starter, plus AI smart scheduling, AI churn predictions, AI analytics, SMS notifications, vaccination records, inventory, loyalty packages.</li>
              <li><strong>Enterprise ($59/month):</strong> Everything in Professional, plus priority email support and onboarding session.</li>
            </ul>
            <h3 className="font-semibold mt-3 mb-1">3.2 Free Trial</h3>
            <p className="text-muted-foreground leading-relaxed">
              All plans include a 14-day free trial. No credit card required to start. You will not be charged
              during the trial period. You must add a payment method before the trial ends to continue using paid features.
            </p>
            <h3 className="font-semibold mt-3 mb-1">3.3 Payment Processing</h3>
            <p className="text-muted-foreground leading-relaxed">
              Subscriptions are billed monthly through Creem, our Merchant of Record. Creem handles all
              payment processing, tax collection, and invoicing. By subscribing, you authorize Creem to charge
              your payment method on a recurring monthly basis until you cancel.
            </p>
            <h3 className="font-semibold mt-3 mb-1">3.4 Plan Changes &amp; Cancellation</h3>
            <p className="text-muted-foreground leading-relaxed">
              You can upgrade, downgrade, or cancel your subscription at any time through the Creem Customer
              Portal. Changes take effect at the next billing cycle. No refunds are provided for partial months
              (see our <Link href="/refund" className="text-primary hover:underline">Refund Policy</Link>).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Use the Service for any illegal purpose or in violation of any local, state, national, or international law</li>
              <li>Upload, store, or transmit any malware, viruses, or malicious code</li>
              <li>Attempt to gain unauthorized access to other users&apos; data, the Service&apos;s systems, or networks</li>
              <li>Use the Service to send spam, phishing, or unsolicited commercial communications</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Resell, sublicense, or redistribute access to the Service without written permission</li>
              <li>Use the AI features to generate harmful, abusive, or discriminatory content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Your Data &amp; Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              You retain all rights to the data you upload to GroomingPro (customer records, pet profiles,
              appointment history, etc.). You grant us a limited license to process this data solely to provide
              the Service to you. We will not access, share, or sell your business data to third parties
              except as required by law or as described in our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. AI Features Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              GroomingPro uses AI (powered by DeepSeek) for features such as smart scheduling, churn prediction,
              natural-language analytics, and content generation. AI outputs are suggestions only and may not
              always be accurate. You are responsible for reviewing AI-generated content before acting on it
              or sharing it with your customers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Service Availability</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive for 99.9% uptime but do not guarantee uninterrupted service. We are not liable for
              downtime caused by maintenance, third-party outages (Supabase, Creem, Vercel, Resend, DeepSeek),
              internet connectivity issues, or events beyond our control. Scheduled maintenance will be
              announced in advance when possible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              GroomingPro, including its design, code, branding, and content, is the intellectual property of
              Winter Math. You may not copy, modify, or distribute any part of the Service without our written
              permission. AI-generated blog content published on our blog is © GroomingPro.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, GroomingPro and Winter Math shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including loss of profits,
              data, or business opportunities, arising from your use of or inability to use the Service.
              Our total liability shall not exceed the amount you paid in the preceding 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">10. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              You may terminate your account at any time by canceling your subscription in the Creem Customer
              Portal. We may suspend or terminate your account if you violate these Terms or engage in
              fraudulent, abusive, or illegal activity. Upon termination, your data will be deleted after 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">11. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms are governed by the laws applicable to the jurisdiction where Winter Math is
              registered. Any disputes shall be resolved through good-faith negotiation first, then binding
              arbitration if necessary.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">12. Changes to These Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms from time to time. We will notify you of significant changes via email
              or in-app notification at least 30 days before they take effect. Continued use of the Service
              after the effective date constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">13. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms, contact us at:
              <br />
              📧 <a href="mailto:1433469126@qq.com" className="text-primary hover:underline">1433469126@qq.com</a>
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}