import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { SavedSpecimen } from '../types/plant';

interface HerbariumLogProps {
  specimens: SavedSpecimen[];
  onOpenSpecimen: (specimen: SavedSpecimen) => void;
  onRemoveSpecimen: (id: string) => void;
}

type LogFilter = 'all' | 'healthy' | 'attention';

export function HerbariumLog({
  specimens,
  onOpenSpecimen,
  onRemoveSpecimen,
}: HerbariumLogProps) {
  const [filter, setFilter] = useState<LogFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSpecimens = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return specimens.filter((item) => {
      const status = item.result.healthAssessment.status;
      if (filter === 'healthy' && status !== 'Healthy') return false;
      if (filter === 'attention' && status === 'Healthy') return false;
      if (!query) return true;
      return (
        item.result.commonName.toLowerCase().includes(query) ||
        item.result.scientificName.toLowerCase().includes(query) ||
        item.result.family.toLowerCase().includes(query)
      );
    });
  }, [specimens, filter, searchQuery]);

  return (
    <section id="specimen-log" className="border-t border-[#e5dec9] pt-12 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
            Personal Archive
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1c1917] mt-1">
            Saved Specimen Log
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#ebe6db] rounded-md">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-[#fbf9f5] text-[#1c1917]'
                  : 'text-[#57534e] hover:text-[#1c1917]'
              }`}
            >
              All ({specimens.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('healthy')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'healthy'
                  ? 'bg-[#fbf9f5] text-[#1c1917]'
                  : 'text-[#57534e] hover:text-[#1c1917]'
              }`}
            >
              Healthy
            </button>
            <button
              type="button"
              onClick={() => setFilter('attention')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                filter === 'attention'
                  ? 'bg-[#fbf9f5] text-[#1c1917]'
                  : 'text-[#57534e] hover:text-[#1c1917]'
              }`}
            >
              Needs Care
            </button>
          </div>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by name or family..."
            className="px-3 py-1.5 text-xs bg-[#fbf9f5] text-[#1c1917] placeholder:text-[#a8a29e] border border-[#d6cebe] rounded-md focus:outline-none focus:border-[#14532d]"
          />
        </div>
      </div>

      {specimens.length === 0 ? (
        <div className="bg-[#f4f0e8] border border-[#dcd4c0] rounded-lg p-8 text-sm text-[#57534e]">
          No specimens saved yet. After identifying a plant photograph, select{' '}
          <strong className="font-semibold text-[#1c1917]">Save to Herbarium</strong> to store its care schedule and watering cadence in your local log.
        </div>
      ) : filteredSpecimens.length === 0 ? (
        <div className="bg-[#f4f0e8] border border-[#dcd4c0] rounded-lg p-8 text-sm text-[#57534e]">
          No saved specimens match the current filter.
        </div>
      ) : (
        <div className="divide-y divide-[#dcd4c0] border-t border-b border-[#dcd4c0]">
          {filteredSpecimens.map((item) => {
            const dateLabel = new Date(item.savedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const status = item.result.healthAssessment.status;
            const statusColor =
              status === 'Healthy'
                ? 'text-[#15803d]'
                : status === 'Critical'
                  ? 'text-[#b91c1c]'
                  : 'text-[#b45309]';

            return (
              <div
                key={item.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <img
                    src={item.thumbnailDataUrl}
                    alt={item.result.commonName}
                    referrerPolicy="no-referrer"
                    className="w-16 h-12 object-cover rounded border border-[#d6cebe] shrink-0 bg-[#ebe6db]"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono text-[#78716c]">
                      <span>{dateLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.result.family}</span>
                      <span aria-hidden="true">·</span>
                      <span className={`font-sans font-semibold ${statusColor}`}>
                        {status}
                      </span>
                    </div>
                    <p className="font-serif text-lg font-semibold text-[#1c1917] truncate">
                      {item.result.commonName}{' '}
                      <span className="italic font-normal text-sm text-[#57534e]">
                        ({item.result.scientificName})
                      </span>
                    </p>
                    <p className="text-xs text-[#57534e] truncate mt-0.5">
                      Water: {item.result.careGuide.water.frequency} · Light: {item.result.careGuide.light.level}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenSpecimen(item)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-[#1c1917] bg-[#f4f0e8] border border-[#d6cebe] rounded-md hover:border-[#14532d] hover:text-[#14532d] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Open Monograph
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSpecimen(item.id)}
                    aria-label={`Remove ${item.result.commonName} from log`}
                    className="p-2 text-[#78716c] hover:text-[#b91c1c] transition-colors cursor-pointer"
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
