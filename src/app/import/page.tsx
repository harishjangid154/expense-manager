import { ImportPanel } from '@/components/ImportPanel';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ImportPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/settings/notifications"
          className="p-2 rounded-lg glass border border-[rgba(255,255,255,0.15)] hover:border-[#00FFFF]/50 transition-colors"
          aria-label="Back to settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Transaction Import
          </h1>
          <p className="text-muted-foreground mt-1">
            Sync your local IndexedDB transactions to the server database
          </p>
        </div>
      </div>
      
      <ImportPanel />
    </div>
  );
}
