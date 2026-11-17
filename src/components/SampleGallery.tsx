import { useState } from 'react';
import { Leaf } from 'lucide-react';
import type { SampleSpecimen } from '../types/plant';

interface SampleGalleryProps {
  samples: SampleSpecimen[];
  activeSampleId: string | null;
  isAnalyzing: boolean;
  onSelectSample: (sample: SampleSpecimen) => void;
}

function SampleCardImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full bg-[#ebe6db] flex flex-col items-center justify-center p-4 text-center text-[#78716c]">
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

export function SampleGallery({
  samples,
  activeSampleId,
  isAnalyzing,
  onSelectSample,
}: SampleGalleryProps) {
  return (
    <section id="reference-samples" className="border-t border-[#e5dec9] pt-12 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
            Herbarium Reference Plates
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1c1917] mt-1">
            Test Recognition on Sample Specimens
          </h2>
        </div>
        <p className="text-xs text-[#57534e] max-w-sm leading-relaxed">
          Select any archival plate below to run live visual species recognition and inspect its full cultivation dossier.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {samples.map((sample) => {
          const isActive = activeSampleId === sample.id;
          return (
            <article
              key={sample.id}
              className={`group flex flex-col justify-between bg-[#f4f0e8] border rounded-lg overflow-hidden transition-colors ${
                isActive ? 'border-[#14532d]' : 'border-[#dcd4c0] hover:border-[#a8a29e]'
              }`}
            >
              <div>
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#ebe6db] border-b border-[#dcd4c0]">
                  <SampleCardImage src={sample.imageUrl} alt={sample.commonName} />
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 font-mono text-[11px] text-[#78716c]">
                    <span>{sample.plateNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{sample.family}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-[#1c1917] mt-1.5">
                    {sample.commonName}
                  </h3>
                  <p className="font-serif italic text-xs text-[#57534e] mt-0.5">
                    {sample.scientificName}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-1">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => onSelectSample(sample)}
                  className="w-full py-2 px-3 text-xs font-semibold text-[#1c1917] bg-[#fbf9f5] border border-[#d6cebe] rounded-md hover:border-[#14532d] hover:text-[#14532d] disabled:opacity-45 transition-colors cursor-pointer whitespace-nowrap"
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
