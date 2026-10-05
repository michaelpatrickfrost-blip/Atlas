'use server';

import { requireSession } from '@/core/auth/session';
import { assertCapability } from '@/core/permissions/capabilities';
import { sendEmail } from '@/core/email/send';
import { db } from '@/core/db/client';
import type { SalesQuote, SalesOrder } from '@prisma/client';

interface SendEmailActionData {
  fromAccountId: string;
  toEmail: string;
  subject: string;
  body: string;
  includeDocument: boolean;
  addSignatureLink?: boolean;
  documentType: 'quote' | 'order' | 'invoice' | 'customer' | 'prospect';
  documentId: string;
}

export async function sendEmailAction(data: SendEmailActionData) {
  const session = await requireSession();
  await assertCapability(session, 'core.email.send');

  const { fromAccountId, toEmail, subject, body, includeDocument, documentType, documentId } = data;

  // Load the email account to verify ownership/access
  const account = await db.emailAccount.findFirst({
    where: {
      id: fromAccountId,
      organisationId: session.organisationId,
    },
  });

  if (!account) {
    throw new Error('Email account not found or not accessible');
  }

  // Load document metadata for linking in the email log
  let documentRef: { id: string; reference?: string } | null = null;

  if (documentType === 'quote') {
    documentRef = await db.salesQuote.findFirst({
      where: { id: documentId, organisationId: session.organisationId },
      select: { id: true, reference: true },
    });
  } else if (documentType === 'order') {
    documentRef = await db.salesOrder.findFirst({
      where: { id: documentId, organisationId: session.organisationId },
      select: { id: true, reference: true },
    });
  } else if (documentType === 'invoice') {
    documentRef = await db.invoice.findFirst({
      where: { id: documentId, organisationId: session.organisationId },
      select: { id: true, reference: true },
    });
  }

  // Send the email
  await sendEmail({
    organisationId: session.organisationId,
    fromAccountId,
    toEmail,
    subject,
    htmlBody: body,
    textBody: body.replace(/<[^>]*>/g, ''), // Strip HTML if present
    linkedQuoteId: documentType === 'quote' ? documentId : undefined,
    linkedOrderId: documentType === 'order' ? documentId : undefined,
    linkedInvoiceId: documentType === 'invoice' ? documentId : undefined,
  });

  return { success: true };
}
