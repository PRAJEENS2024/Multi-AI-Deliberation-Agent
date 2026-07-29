import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, FileCode, Loader2, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

import { API_URL } from '../config';


interface ExportReportProps {
  sessionId: string;
  disabled?: boolean;
}

export default function ExportReport({ sessionId, disabled }: ExportReportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExporting(true);
    setStatus(null);
    try {
      const endpoint = format === 'docx' ? `${API_URL}/export/download-docx` : `${API_URL}/export/download`;

      const res = await axios.post(endpoint, {
        session_id: sessionId,
        format: format,
      }, {
        responseType: 'blob',
      });

      const ext = format === 'docx' ? 'docx' : 'pdf';
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai_jury_report_${sessionId.slice(0, 8)}.${ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setStatus({ type: 'success', message: `${format.toUpperCase()} report downloaded!` });
      setIsOpen(false);
    } catch (err: any) {
      setStatus({ type: 'error', message: 'Export failed. Session may still be processing.' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || exporting}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-dark-surface hover:bg-dark-surface-hover border border-dark-border rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
        title="Export Report"
      >
        {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
        Export
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-0 top-full mt-1 w-44 bg-dark-surface border border-dark-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-1.5 space-y-0.5">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-dark-surface-hover text-xs text-gray-300 transition-colors cursor-pointer"
              >
                <FileText size={14} className="text-red-400" />
                <span>Export as PDF</span>
              </button>
              <button
                onClick={() => handleExport('docx')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-dark-surface-hover text-xs text-gray-300 transition-colors cursor-pointer"
              >
                <FileCode size={14} className="text-blue-400" />
                <span>Export as Document</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl z-50 text-sm"
            style={{
              background: status.type === 'success' ? '#065f46' : '#7f1d1d',
              border: `1px solid ${status.type === 'success' ? '#10b981' : '#ef4444'}`,
            }}
          >
            {status.type === 'success' ? <CheckCircle size={16} className="text-green-400" /> : <XCircle size={16} className="text-red-400" />}
            <span className="text-white">{status.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
