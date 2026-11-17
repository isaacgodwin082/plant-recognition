import { useMemo, useState } from 'react';
import { Droplets, Trash2 } from 'lucide-react';
import type { SavedPlantEntry } from '../types/plant';

interface MyPlantsCollectionProps {
  plants: SavedPlantEntry[];
  onOpenPlant: (entry: SavedPlantEntry) => void;
  onMarkWatered: (id: string) => void;
  onRemovePlant: (id: string) => void;
}

type CollectionFilter = 'all' | 'healthy' | 'attention' | 'due';

function getDaysUntilWatering(entry: SavedPlantEntry): number {
  const interval = Math.max(1, entry.result.careGuide.water.recommendedIntervalDays || 7);
  const lastMs = new Date(entry.lastWateredAt).getTime();
  const nextMs = lastMs + interval * 24 * 60 * 60 * 1000;
  return Math.ceil((nextMs - Date.now()) / (24 * 60 * 60 * 1000));
}

export function MyPlantsCollection({
  plants,
  onOpenPlant,
  onMarkWatered,
  onRemovePlant,
}: MyPlantsCollectionProps) {
  const [filter, setFilter] = useState<CollectionFilter>('all');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plants.filter((entry) => {
      const status = entry.result.healthAssessment.status;
      const daysLeft = getDaysUntilWatering(entry);
      if (filter === 'healthy' && status !== 'Healthy') return false;
      if (filter === 'attention' && status === 'Healthy') return false;
      if (filter === 'due' && daysLeft > 0) return false;
      if (!q) return true;
      return (
        entry.result.commonName.toLowerCase().includes(q) ||
        entry.result.scientificName.toLowerCase().includes(q) ||
        entry.result.family.toLowerCase().includes(q)
      );
    });
  }, [plants, filter, query]);

  return (
    <section id="my-plants" className="border-t border-slate-200 pt-12 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
            Saved Collection &amp; Watering Cadence
          </span>
          <h2 className="font-serif text-3xl font-semibold text-slate-900 mt-1">
            My Plants
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md">
            {(
              [
                ['all', `All (${plants.length})`],
                ['healthy', 'Healthy'],
                ['attention', 'Needs Care'],
                ['due', 'Water Due'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  filter === key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search saved plants..."
            className="px-3 py-1.5 text-xs bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:outline-none focus:border-[#14532d]"
          />
        </div>
      </div>

      {plants.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-sm text-slate-600">
          No plants saved yet. Identify a plant photo above and click{' '}
          <strong className="font-semibold text-slate-900">Save to My Plants</strong> to track its care instructions and watering schedule here.
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-sm text-slate-600">
          No saved plants match the active filter.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
          {filtered.map((entry) => {
            const daysLeft = getDaysUntilWatering(entry);
            const waterLabel =
              daysLeft <= 0
                ? 'Water due today'
                : daysLeft === 1
                  ? 'Water due tomorrow'
                  : `Next water in ${daysLeft} days`;
            const status = entry.result.healthAssessment.status;
            const statusColor =
              status === 'Healthy'
                ? 'text-emerald-700'
                : status === 'Critical'
                  ? 'text-red-700'
                  : 'text-amber-700';

            return (
              <div
                key={entry.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={entry.thumbnailDataUrl}
                    alt={entry.result.commonName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 object-cover rounded border border-slate-200 shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-slate-500">
                      <span>{entry.environment}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-sans font-semibold ${statusColor}`}>{status}</span>
                      <span aria-hidden="true">·</span>
                      <span className={daysLeft <= 0 ? 'text-amber-700 font-semibold' : ''}>
                        {waterLabel}
                      </span>
                    </div>
                    <p className="font-serif text-xl font-semibold text-slate-900 truncate">
                      {entry.result.commonName}{' '}
                      <span className="italic font-normal text-sm text-slate-600">
                        ({entry.result.scientificName})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      Light: {entry.result.careGuide.light.level} · Water: {entry.result.careGuide.water.frequency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onMarkWatered(entry.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#14532d] bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    Watered Today
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenPlant(entry)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-300 rounded-md hover:border-[#14532d] hover:text-[#14532d] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Care Sheet
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemovePlant(entry.id)}
                    aria-label={`Remove ${entry.result.commonName}`}
                    className="p-2 text-slate-400 hover:text-red-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
