'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

export function EmailWebhookTester() {
  const [recipientEmail, setRecipientEmail] = useState('demo@expensemanager.com');
  const [subject, setSubject] = useState('Payment of Rs. 1,234.56 debited from your account');
  const [text, setText] = useState(
    'Dear Customer, Rs. 1,234.56 has been debited from your account at Amazon on 2024-11-02. Available balance: Rs. 10,000.00'
  );
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSendTest = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (secret) {
        headers['x-inbound-secret'] = secret;
      }

      const res = await fetch('/api/webhooks/email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: recipientEmail,
          from: 'bank@example.com',
          subject,
          text,
        }),
      });

      const data = await res.json();
      setResponse({ status: res.status, data });

      if (!res.ok) {
        setError(`HTTP ${res.status}: ${data.error || 'Request failed'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-strong p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Email Webhook Tester
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          Test the email webhook endpoint by sending sample email payloads
        </p>

        <div className="space-y-4">
          {/* Recipient Email */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Recipient Email (User)
            </label>
            <Input
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="user@example.com"
              className="glass border-[rgba(255,255,255,0.15)]"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Email Subject
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Transaction alert"
              className="glass border-[rgba(255,255,255,0.15)]"
            />
          </div>

          {/* Body Text */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Email Body (Plain Text)
            </label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Email body content..."
              rows={6}
              className="glass border-[rgba(255,255,255,0.15)]"
            />
          </div>

          {/* Secret (Optional) */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Webhook Secret (Optional)
            </label>
            <Input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Leave empty if not configured"
              type="password"
              className="glass border-[rgba(255,255,255,0.15)]"
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendTest}
            disabled={loading}
            className="w-full bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Test Webhook
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Response Display */}
      {(response || error) && (
        <div className="glass-strong p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            {error ? (
              <>
                <XCircle className="w-5 h-5 text-red-400" />
                Error
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 text-green-400" />
                Response
              </>
            )}
          </h3>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {response && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <span
                  className={`text-sm font-semibold ${
                    response.status >= 200 && response.status < 300
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {response.status}
                </span>
              </div>

              <div>
                <span className="text-sm font-medium text-muted-foreground block mb-2">
                  Response Data:
                </span>
                <pre className="glass p-4 rounded-xl text-xs overflow-x-auto">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Payloads */}
      <div className="glass-strong p-6 rounded-2xl">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Sample Payloads
        </h3>
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubject('Debit Alert: Rs. 500 spent at Starbucks');
              setText(
                'Your account has been debited by Rs. 500.00 at Starbucks on 02-Nov-2024. Available balance: Rs. 9,500.00'
              );
            }}
            className="glass border-[rgba(255,255,255,0.2)]"
          >
            Load Debit Example
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubject('Credit Alert: $1,000 deposited');
              setText(
                'USD 1,000.00 has been credited to your account on Nov 02, 2024. Current balance: $10,500.00'
              );
            }}
            className="glass border-[rgba(255,255,255,0.2)] ml-2"
          >
            Load Credit Example
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubject('Credit Card Payment: Card ending 1234 charged');
              setText(
                'Your credit card ending 1234 has been charged Rs. 2,500.00 for payment at Amazon on 02-Nov-2024.'
              );
            }}
            className="glass border-[rgba(255,255,255,0.2)] ml-2"
          >
            Load CC Payment
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubject('EMI Payment Due - HDFC Bank Loan');
              setText(
                'Your monthly EMI of Rs. 15,000 for HDFC Bank Loan is due on 05-Nov-2024. Please ensure sufficient balance.'
              );
            }}
            className="glass border-[rgba(255,255,255,0.2)] ml-2"
          >
            Load Loan Notice
          </Button>
        </div>
      </div>
    </div>
  );
}
