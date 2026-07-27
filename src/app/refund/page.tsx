import Link from "next/link"
import { PawPrint } from "lucide-react"

export const metadata = {
  title: "Refund Policy | GroomingPro",
  description: "GroomingPro's refund and cancellation policy.",
}

export default function RefundPolicyPage() {
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
        <h1 className="text-3xl font-extrabold mb-2">Refund Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: July 27, 2026</p>

        <div className="prose prose-amber max-w-none space-y-6 text-foreground">
          <section>
            <h2 className="text-xl font-bold mb-2">1. Free Trial</h2>
            <p className="text-muted-foreground leading-relaxed">
              GroomingPro offers a 14-day free trial on all paid plans. No credit card is required to start
              the trial. You will not be charged during the trial period. If you cancel before the trial ends,
              you will not be billed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">2. Monthly Subscriptions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Subscriptions are billed monthly in advance through Creem (our Merchant of Record). All payments
              are processed by Creem, which appears as the seller of record on your invoice and credit card statement.
            </p>
            <h3 className="font-semibold mt-3 mb-1">Cancellation</h3>
            <p className="text-muted-foreground leading-relaxed">
              You can cancel your subscription at any time through the Creem Customer Portal. Cancellation
              takes effect at the end of your current billing period. You will retain access to paid features
              until the period ends.
            </p>
            <h3 className="font-semibold mt-3 mb-1">Partial Month Refunds</h3>
            <p className="text-muted-foreground leading-relaxed">
              We do not provide prorated refunds for partial billing months. If you cancel mid-month, you
              keep access until the month ends but will not be charged again.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">3. Refund Eligibility</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">You may be eligible for a refund if:</p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>You were charged during a free trial that you canceled in time (full refund of the charge)</li>
              <li>You experienced a duplicate charge due to a billing error (full refund of the duplicate)</li>
              <li>The Service was completely unavailable for more than 72 consecutive hours due to our fault (prorated refund for the downtime period)</li>
              <li>You accidentally upgraded to a higher plan and request a downgrade within 48 hours (we will refund the difference)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              Refunds are NOT provided for:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Failure to cancel before a billing cycle renews</li>
              <li>Unused time after cancellation (you keep access until period end)</li>
              <li>Dissatisfaction after the free trial period has ended</li>
              <li>Charges from more than 30 days ago</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">4. How to Request a Refund</h2>
            <p className="text-muted-foreground leading-relaxed">
              To request a refund, email us at <a href="mailto:support@petsalonos.com" className="text-primary hover:underline">support@petsalonos.com</a> with:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li>Your account email</li>
              <li>The charge date and amount</li>
              <li>The reason for your refund request</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-2">
              We will review your request within 3 business days. Approved refunds are processed through Creem
              and typically appear on your card within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">5. Chargebacks</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you believe a charge is fraudulent or unauthorized, please contact us first at
              <a href="mailto:support@petsalonos.com" className="text-primary hover:underline"> support@petsalonos.com</a> before
              initiating a chargeback with your bank. We will work to resolve the issue quickly. Unauthorized
              chargebacks may result in account suspension.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">6. Plan-Specific Notes</h2>
            <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
              <li><strong>Starter Plan:</strong> Standard refund policy applies.</li>
              <li><strong>Professional Plan:</strong> Standard refund policy applies. AI features used during a refunded period are not recoverable.</li>
              <li><strong>Enterprise Plan:</strong> Custom terms may apply for annual contracts. Contact us for details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold mb-2">7. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For refund questions, contact us at:
              <br />
              📧 <a href="mailto:support@petsalonos.com" className="text-primary hover:underline">support@petsalonos.com</a>
              <br />
              We aim to respond within 1 business day.
            </p>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 mt-8">
            <p className="text-sm text-amber-800 leading-relaxed">
              <strong>Quick summary:</strong> 14-day free trial, cancel anytime, no prorated partial-month refunds,
              full refunds for billing errors or trial-period charges. Email support@petsalonos.com for help.
            </p>
          </section>
        </div>
      </article>
    </div>
  )
}