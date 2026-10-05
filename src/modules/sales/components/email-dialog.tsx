'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { EmailAccount } from '@prisma/client';

interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  documentType: 'quote' | 'order' | 'invoice' | 'customer' | 'prospect';
  documentId: string;
  emailAccounts: EmailAccount[];
  onSend: (data: {
    fromAccountId: string;
    toEmail: string;
    subject: string;
    body: string;
    includeDocument: boolean;
    addSignatureLink?: boolean;
  }) => Promise<void>;
}

export function EmailDialog({
  open,
  onOpenChange,
  recipientEmail,
  recipientName,
  subject: defaultSubject,
  documentType,
  documentId,
  emailAccounts,
  onSend,
}: EmailDialogProps) {
  const [fromAccountId, setFromAccountId] = useState(emailAccounts[0]?.id ?? '');
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(`Dear ${recipientName},\n\nPlease find attached.\n\nBest regards`);
  const [includeDocument, setIncludeDocument] = useState(true);
  const [addSignatureLink, setAddSignatureLink] = useState(documentType === 'quote');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      await onSend({
        fromAccountId,
        toEmail: recipientEmail,
        subject,
        body,
        includeDocument,
        addSignatureLink: documentType === 'quote' ? addSignatureLink : undefined,
      });
      onOpenChange(false);
      // Reset form
      setSubject(defaultSubject);
      setBody(`Dear ${recipientName},\n\nPlease find attached.\n\nBest regards`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email {recipientName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">From</label>
            <select
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              {emailAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.fromName} &lt;{account.fromAddress}&gt;
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">To</label>
            <input type="email" value={recipientEmail} disabled className="w-full px-3 py-2 border rounded bg-gray-50" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border rounded font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeDocument}
                onChange={(e) => setIncludeDocument(e.target.checked)}
              />
              <span className="text-sm">Attach {documentType}</span>
            </label>
            {documentType === 'quote' && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addSignatureLink}
                  onChange={(e) => setAddSignatureLink(e.target.checked)}
                />
                <span className="text-sm">Add signature link for quote acceptance</span>
              </label>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={isLoading || !fromAccountId}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
