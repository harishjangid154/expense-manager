'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function ExportButton() {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export/transactions?format=${format}`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export transactions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 items-center">
      <Select value={format} onValueChange={(value: 'csv' | 'xlsx') => setFormat(value)}>
        <SelectTrigger className="w-32 glass border-[rgba(255,255,255,0.15)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="glass-strong border-[rgba(255,255,255,0.2)]">
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="xlsx">XLSX</SelectItem>
        </SelectContent>
      </Select>

      <Button
        onClick={handleExport}
        disabled={loading}
        className="bg-[#00FFFF] text-[#0B0C10] hover:brightness-110"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export
          </>
        )}
      </Button>
    </div>
  );
}
