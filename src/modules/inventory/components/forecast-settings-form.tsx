'use client';

import { useState } from 'react';
import { updateProductForecastSettings } from '../actions';
import { Button } from '@/components/ui/button';

interface ForecastSettingsFormProps {
  productId: string;
  currentSettings?: {
    safetyStockLevel?: number;
    leadTimeDays?: number;
    averageDailyDemand?: number;
    forecastMethod?: string;
  };
  onSuccess?: () => void;
}

export function ForecastSettingsForm({
  productId,
  currentSettings,
  onSuccess,
}: ForecastSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    safetyStockLevel: currentSettings?.safetyStockLevel || 0,
    leadTimeDays: currentSettings?.leadTimeDays || 0,
    averageDailyDemand: currentSettings?.averageDailyDemand || 0,
    forecastMethod: currentSettings?.forecastMethod || 'EXPONENTIAL_SMOOTHING',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await updateProductForecastSettings(productId, formData);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Safety Stock Level (units)</label>
          <input
            type="number"
            min="0"
            value={formData.safetyStockLevel}
            onChange={(e) =>
              setFormData({
                ...formData,
                safetyStockLevel: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="0"
          />
          <p className="text-xs text-gray-600 mt-1">
            Minimum stock to maintain during lead time
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lead Time (days)</label>
          <input
            type="number"
            min="0"
            value={formData.leadTimeDays}
            onChange={(e) =>
              setFormData({
                ...formData,
                leadTimeDays: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="0"
          />
          <p className="text-xs text-gray-600 mt-1">Days from order to delivery</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Average Daily Demand (units)</label>
        <input
          type="number"
          min="0"
          value={formData.averageDailyDemand}
          onChange={(e) =>
            setFormData({
              ...formData,
              averageDailyDemand: parseInt(e.target.value) || 0,
            })
          }
          className="w-full px-3 py-2 border rounded"
          placeholder="0"
        />
        <p className="text-xs text-gray-600 mt-1">
          Historical average units sold per day
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Forecast Method</label>
        <select
          value={formData.forecastMethod}
          onChange={(e) =>
            setFormData({
              ...formData,
              forecastMethod: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded"
        >
          <option value="EXPONENTIAL_SMOOTHING">Exponential Smoothing</option>
          <option value="MOVING_AVERAGE">Moving Average</option>
          <option value="LINEAR_REGRESSION">Linear Regression</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">
          Algorithm for demand prediction
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" type="button" disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </form>
  );
}
