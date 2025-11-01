import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { Mail, MessageSquare, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AutoImportSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AutoImportSettings({ open, onOpenChange }: AutoImportSettingsProps) {
  const [gmailConnected, setGmailConnected] = useState(false);
  const [smsConnected, setSmsConnected] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong border-[rgba(255,255,255,0.2)] rounded-3xl max-w-2xl backdrop-blur-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#00FFFF]" />
            Auto-Import Transactions
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Automatically read and import expenses from your Gmail and SMS
          </DialogDescription>
        </DialogHeader>

        <Alert className="glass border-[rgba(255,255,255,0.15)]">
          <AlertCircle className="w-4 h-4 text-[#00FFFF]" />
          <AlertDescription className="text-sm text-muted-foreground">
            This feature requires backend integration with Supabase to securely handle API credentials and process transactions.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="gmail" className="w-full">
          <TabsList className="glass border-[rgba(255,255,255,0.15)] rounded-xl mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="gmail" className="rounded-lg">
              <Mail className="w-4 h-4 mr-2" />
              Gmail
            </TabsTrigger>
            <TabsTrigger value="sms" className="rounded-lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gmail" className="space-y-4">
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-foreground">Gmail Integration</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Scan emails from banks and payment apps
                  </p>
                </div>
                {gmailConnected ? (
                  <div className="flex items-center gap-2 text-[#6BCB77]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Connected</span>
                  </div>
                ) : (
                  <Button
                    className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] neon-glow-blue rounded-xl"
                    disabled
                  >
                    Connect Gmail
                  </Button>
                )}
              </div>
            </div>

            <div className="glass rounded-xl p-4 space-y-3">
              <h5 className="text-sm text-foreground">How it works:</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFFF] mt-1">1.</span>
                  <span>Connect your Gmail account using Google OAuth</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFFF] mt-1">2.</span>
                  <span>We'll scan transaction emails from banks, UPI apps, and credit card companies</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFFF] mt-1">3.</span>
                  <span>AI extracts amount, merchant, category, and date automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFFF] mt-1">4.</span>
                  <span>Review and approve transactions before they're added</span>
                </li>
              </ul>
            </div>

            <div className="glass rounded-xl p-4">
              <h5 className="text-sm text-foreground mb-2">Supported Sources:</h5>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Paytm', 'PhonePe', 'Google Pay', 'Amazon Pay'].map((source) => (
                  <div key={source} className="glass-strong rounded-lg p-2 text-xs text-muted-foreground text-center">
                    {source}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="glass rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-foreground">SMS Integration</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Read transaction SMS from your phone
                  </p>
                </div>
                {smsConnected ? (
                  <div className="flex items-center gap-2 text-[#6BCB77]">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm">Connected</span>
                  </div>
                ) : (
                  <Button
                    className="bg-[#00FFFF] hover:bg-[#00CCCC] text-[#0B0C10] neon-glow-blue rounded-xl"
                    disabled
                  >
                    Connect SMS
                  </Button>
                )}
              </div>
            </div>

            <div className="glass rounded-xl p-4 space-y-3">
              <h5 className="text-sm text-foreground">How it works:</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-[#A259FF] mt-1">1.</span>
                  <span>Install our mobile companion app (Android/iOS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A259FF] mt-1">2.</span>
                  <span>Grant SMS read permission (locally on your device)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A259FF] mt-1">3.</span>
                  <span>Transaction SMS are parsed and synced securely</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#A259FF] mt-1">4.</span>
                  <span>Only transaction data is sent, never full SMS content</span>
                </li>
              </ul>
            </div>

            <Alert className="glass border-[rgba(255,255,255,0.15)] border-[#FFD93D]">
              <AlertCircle className="w-4 h-4 text-[#FFD93D]" />
              <AlertDescription className="text-sm text-muted-foreground">
                <strong className="text-foreground">Privacy First:</strong> SMS content is processed on your device. Only structured transaction data is synced.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <div className="glass rounded-xl p-4 border border-[rgba(255,255,255,0.15)]">
          <h5 className="text-sm text-foreground mb-2">⚡ Backend Required</h5>
          <p className="text-xs text-muted-foreground mb-3">
            This feature needs Supabase integration for:
          </p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Secure OAuth token storage</li>
            <li>• Gmail API and Twilio integration</li>
            <li>• Background email/SMS processing</li>
            <li>• AI-powered transaction parsing</li>
          </ul>
          <Button
            className="w-full mt-4 glass border-[rgba(255,255,255,0.2)] hover:glass-strong rounded-xl h-10"
            variant="outline"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Enable Backend (Coming Soon)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
