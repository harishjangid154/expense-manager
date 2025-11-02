import { ExportButton } from '@/components/ExportButton';
import { Download, FileText, Table } from 'lucide-react';

export default function ExportPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Export Data</h1>
        <p className="text-muted-foreground mt-1">
          Download your transaction history in various formats
        </p>
      </div>

      {/* Export Options */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <Download className="w-5 h-5 text-[#00FFFF]" />
          Export Transactions
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select a format and download your complete transaction history
        </p>
        <ExportButton />
      </div>

      {/* Format Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <FileText className="w-6 h-6 text-[#00FFFF]" />
            <h3 className="text-lg font-semibold text-foreground">CSV Format</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Plain text format compatible with most spreadsheet applications. Ideal for
            data analysis and custom processing.
          </p>
        </div>

        <div className="glass-strong rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <Table className="w-6 h-6 text-[#A259FF]" />
            <h3 className="text-lg font-semibold text-foreground">XLSX Format</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Microsoft Excel format with formatting and formulas. Best for detailed
            financial reports and presentations.
          </p>
        </div>
      </div>

      {/* Export Info */}
      <div className="glass-strong rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          What's Included
        </h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-[#00FFFF] mt-0.5">•</span>
            <span>All transaction records with dates, amounts, and categories</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00FFFF] mt-0.5">•</span>
            <span>Merchant information and transaction notes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00FFFF] mt-0.5">•</span>
            <span>Currency codes and original amounts (if applicable)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#00FFFF] mt-0.5">•</span>
            <span>Account information and metadata</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
