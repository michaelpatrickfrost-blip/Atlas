'use client';

import { formatDistanceToNow } from 'date-fns';
import { Mail, Download } from 'lucide-react';
import type { EmailMessage } from '@prisma/client';

interface EmailThreadPanelProps {
  messages: EmailMessage[];
}

export function EmailThreadPanel({ messages }: EmailThreadPanelProps) {
  if (messages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Mail className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No emails sent yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="border rounded-lg p-4 bg-white">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-medium text-sm">
                {message.toEmail}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs rounded font-medium ${
              message.status === 'SENT'
                ? 'bg-green-100 text-green-700'
                : message.status === 'FAILED'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
            }`}>
              {message.status}
            </span>
          </div>

          <p className="font-medium text-sm mb-2">{message.subject}</p>

          <div className="bg-gray-50 rounded p-3 text-sm max-h-48 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: message.htmlBody || message.textBody || '' }} />
          </div>

          {message.error && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 text-xs rounded">
              Error: {message.error}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
