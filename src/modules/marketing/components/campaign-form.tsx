'use client';

import { useState } from 'react';
import { createMarketingCampaign, updateMarketingCampaign } from '../actions';
import { Button } from '@/components/ui/button';

interface CampaignFormProps {
  campaign?: {
    id: string;
    name: string;
    description: string;
    objective: string;
    budget: number;
    status: string;
  };
  onSuccess?: () => void;
}

export function CampaignForm({ campaign, onSuccess }: CampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    description: campaign?.description || '',
    objective: campaign?.objective || 'AWARENESS',
    budget: campaign ? campaign.budget / 100 : 0,
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
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border rounded"
          rows={3}
          placeholder="Campaign overview and goals"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Objective *</label>
          <select
            required
            value={formData.objective}
            onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="AWARENESS">Brand Awareness</option>
            <option value="CONSIDERATION">Consideration</option>
            <option value="CONVERSION">Conversion</option>
            <option value="RETENTION">Retention</option>
            <option value="ADVOCACY">Advocacy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Budget (£)</label>
          <input
            type="number"
            min="0"
            step="100"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded"
            placeholder="0"
          />
        </div>
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
        <Button variant="outline" type="button" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}
        </Button>
      </div>
    </form>
  );
}
