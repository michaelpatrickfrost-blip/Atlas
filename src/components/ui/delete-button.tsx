'use client';

import { Button } from '@/components/ui/button';

export function DeleteButton({
  onConfirm,
  itemName,
  variant = 'danger',
  disabled = false,
  className = '',
}: {
  onConfirm: () => void | Promise<void>;
  itemName: string;
  variant?: 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const handleClick = () => {
    const message = `Delete ${itemName}? This cannot be undone.`;
    if (window.confirm(message)) {
      void onConfirm();
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      Delete
    </Button>
  );
}

export function ReverseButton({
  onConfirm,
  itemName,
  variant = 'ghost',
  disabled = false,
  className = '',
}: {
  onConfirm: () => void | Promise<void>;
  itemName: string;
  variant?: 'danger' | 'ghost';
  disabled?: boolean;
  className?: string;
}) {
  const handleClick = () => {
    const message = `Reverse ${itemName}? This will undo the action.`;
    if (window.confirm(message)) {
      void onConfirm();
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      Reverse
    </Button>
  );
}
