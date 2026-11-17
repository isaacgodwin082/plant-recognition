import { useState } from 'react';
import { Leaf } from 'lucide-react';
import type { SampleSpecimen } from '../types/plant';

interface SamplePlatesProps {
  samples: SampleSpecimen[];
  activeSampleId: string | null;
  isAnalyzing: boolean;
  onSelectSample: (sample: SampleSpecimen) => void;
}

function PlateImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4 text-center text-slate-500">
        <Leaf className="w-6 h-6 mb-1.5 opacity-60" />
        <span className="text-xs font-medium">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
    />
  );
}

export function SamplePlates({
  samples,
  activeSampleId,
  isAnalyzing,
  onSelectSample,
}: SamplePlatesProps) {
  return (
    <section id="sample-plates" className="border-t border-slate-200 pt-12 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
            Botanical Reference Set
          </span>
          <h2 className="font-serif text-3xl font-semibold text-slate-900 mt-1">
            Sample Specimen Plates
          </h2>
        </div>
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
          Click any reference photograph to test live species identification, health inspection, and seasonal care generation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {samples.map((sample) => {
          const isActive = activeSampleId === sample.id;
          return (
            <article
              key={sample.id}
              className={`group flex flex-col justify-between bg-slate-50 border rounded-lg overflow-hidden transition-colors ${
                isActive ? 'border-[#14532d]' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                  <PlateImage src={sample.imageUrl} alt={sample.commonName} />
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500">
                    <span>{sample.plateNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{sample.family}</span>
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-slate-900 mt-1">
                    {sample.commonName}
                  </h3>
                  <p className="font-serif italic text-sm text-slate-600">
                    {sample.scientificName}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-1">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => onSelectSample(sample)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-md hover:border-[#14532d] hover:text-[#14532d] disabled:opacity-45 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isAnalyzing && isActive ? 'Analyzing Plate...' : 'Identify Specimen'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
