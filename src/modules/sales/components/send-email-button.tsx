'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { EmailDialog } from './email-dialog';
import { sendEmailAction } from '../actions';
import type { EmailAccount } from '@prisma/client';

interface SendEmailButtonProps {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  documentType: 'quote' | 'order' | 'invoice' | 'customer' | 'prospect';
  documentId: string;
  emailAccounts: EmailAccount[];
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function SendEmailButton({
  recipientEmail,
  recipientName,
  subject,
  documentType,
  documentId,
  emailAccounts,
  size = 'md',
  variant = 'outline',
}: SendEmailButtonProps) {
  const [open, setOpen] = useState(false);

  if (!emailAccounts || emailAccounts.length === 0) {
    return (
      <Button variant="ghost" size={size} disabled title="No email accounts configured">
        <Mail className="w-4 h-4 mr-1.5" />
        Email
      </Button>
    );
  }

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <Mail className="w-4 h-4 mr-1.5" />
        Email
      </Button>

      <EmailDialog
        open={open}
        onOpenChange={setOpen}
        recipientEmail={recipientEmail}
        recipientName={recipientName}
        subject={subject}
        documentType={documentType}
        documentId={documentId}
        emailAccounts={emailAccounts}
        onSend={async (data) => {
          await sendEmailAction({
            ...data,
            documentType,
            documentId,
          });
        }}
      />
    </>
  );
}
