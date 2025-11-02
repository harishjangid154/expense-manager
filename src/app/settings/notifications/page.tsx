import { EmailWebhookTester } from '@/components/EmailWebhookTester';
import { Mail, Webhook, Settings as SettingsIcon } from 'lucide-react';

export default function NotificationsSettingsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-[#00FFFF]" />
          Notification Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure email webhooks and test transaction auto-import
        </p>
      </div>

        {/* Setup Instructions */}
        <div className="glass-strong p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-[#00FFFF]" />
            Email Webhook Setup
          </h2>

          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                1. Configure SendGrid Inbound Parse
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Go to{' '}
                  <a
                    href="https://app.sendgrid.com/settings/parse"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00FFFF] hover:underline"
                  >
                    SendGrid Inbound Parse Settings
                  </a>
                </li>
                <li>Add a new host & URL</li>
                <li>
                  Set the destination URL to:{' '}
                  <code className="glass px-2 py-1 rounded text-xs">
                    https://yourdomain.com/api/webhooks/email
                  </code>
                </li>
                <li>
                  Add custom header:{' '}
                  <code className="glass px-2 py-1 rounded text-xs">
                    x-inbound-secret: your-secret-here
                  </code>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                2. Environment Variables
              </h3>
              <p className="mb-2">Add these to your <code>.env</code> file:</p>
              <pre className="glass p-4 rounded-xl text-xs overflow-x-auto">
{`SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_INBOUND_ENDPOINT_SECRET=your-webhook-secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
NOTIFICATIONS_FROM_EMAIL=no-reply@yourdomain.com`}
              </pre>
            </div>

            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                3. How It Works
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>
                  Bank/service sends transaction alert emails to your configured address
                </li>
                <li>SendGrid forwards the email to your webhook endpoint</li>
                <li>The webhook parses the email and extracts transaction details</li>
                <li>Transaction is automatically created in your account</li>
                <li>Credit card payments trigger email/SMS alerts</li>
                <li>Loan/EMI notices create recurring payment prompts</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-medium text-foreground mb-2">
                4. Supported Email Formats
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Debit/credit transaction alerts</li>
                <li>Credit card payment notifications</li>
                <li>Loan/EMI payment reminders</li>
                <li>Multiple currencies (₹, $, €, £, ¥)</li>
                <li>Various date formats</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Email Tester */}
        <div className="glass-strong p-6 rounded-2xl mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#00FFFF]" />
            Test Email Webhook
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Send test email payloads to verify your webhook is working correctly
          </p>
          <EmailWebhookTester />
        </div>

        {/* Additional Notes */}
        <div className="glass-strong p-6 rounded-2xl">
          <h2 className="text-xl font-semibold text-foreground mb-4">
            Important Notes
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li>
              Ensure the recipient email in test payloads matches a user in your database
            </li>
            <li>
              The webhook will return 202 (Accepted) if the user is not found, preventing
              retry loops
            </li>
            <li>
              Transactions are deduplicated using clientId or by checking recent similar
              transactions
            </li>
            <li>
              Credit card alerts require both SENDGRID_API_KEY (or SMTP) and TWILIO
              credentials
            </li>
            <li>
              Loan notices currently log to console; see code TODOs for database storage
              options
            </li>
          </ul>
        </div>
      </div>
  );
}
