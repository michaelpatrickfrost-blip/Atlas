'use client';

import { useState } from 'react';
import { createMarketingCampaign, updateMarketingCampaign } from '../actions';
import { Button } from '@/components/ui/button';

interface CampaignFormProps {
  campaign?: {
    id: string;
    name: string;
    status: string;
  };
  onSuccess?: () => void;
}

export function CampaignForm({ campaign, onSuccess }: CampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    status: campaign?.status || 'DRAFT',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (campaign?.id) {
        await updateMarketingCampaign(campaign.id, formData);
      } else {
        await createMarketingCampaign(formData);
      }
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Campaign Name *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          placeholder="E.g., Q4 Product Launch"
        />
      </div>


      <div>
        <label className="block text-sm font-medium mb-2">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" disabled={isLoading} className="bg-gray-100 text-gray-800 hover:bg-gray-200">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}
