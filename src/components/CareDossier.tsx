import { useState } from 'react';
import { Bookmark, Check, Send } from 'lucide-react';
import type { CareChatMessage, HealthStatus, PlantIdentificationResult } from '../types/plant';

interface CareDossierProps {
  result: PlantIdentificationResult | null;
  isAnalyzing: boolean;
  isSaved: boolean;
  specimenImageBase64?: string;
  specimenMimeType?: string;
  onSaveSpecimen: () => void;
  onResetUpload: () => void;
}

function formatHealthMarker(status: HealthStatus): { glyph: string; colorClass: string } {
  switch (status) {
    case 'Healthy':
      return { glyph: '●', colorClass: 'text-[#15803d]' };
    case 'Needs Attention':
      return { glyph: '▲', colorClass: 'text-[#b45309]' };
    case 'Critical':
      return { glyph: '✖', colorClass: 'text-[#b91c1c]' };
    default:
      return { glyph: '●', colorClass: 'text-[#57534e]' };
  }
}

const SUGGESTED_QUESTIONS = [
  'How do I propagate this species cleanly?',
  'What early stress signs should I watch for?',
  'How should watering change in winter?',
];

export function CareDossier({
  result,
  isAnalyzing,
  isSaved,
  specimenImageBase64,
  specimenMimeType,
  onSaveSpecimen,
  onResetUpload,
}: CareDossierProps) {
  const [chatHistory, setChatHistory] = useState<CareChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const handleAskQuestion = async (rawQuestion: string) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || !result || isAsking) return;

    setChatError(null);
    const updatedHistory: CareChatMessage[] = [...chatHistory, { role: 'user', text: trimmed }];
    setChatHistory(updatedHistory);
    setQuestionInput('');
    setIsAsking(true);

    try {
      const response = await fetch('/api/care-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specimen: result,
          question: trimmed,
          history: chatHistory,
          imageBase64: specimenImageBase64,
          mimeType: specimenMimeType,
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Could not retrieve care advice.');
      }

      setChatHistory([...updatedHistory, { role: 'model', text: data.answer || '' }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to send horticultural question.');
    } finally {
      setIsAsking(false);
    }
  };

  if (isAnalyzing) {
    return (
      <section
        id="care-guide"
        aria-live="polite"
        className="border-t border-[#e5dec9] pt-12 pb-8"
      >
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[#78716c]">
            Taxonomic Analysis In Progress
          </p>
          <h2 className="font-serif text-3xl font-medium text-[#1c1917] mt-2">
            Inspecting leaf morphology and cultivar markers...
          </h2>
          <p className="text-sm text-[#57534e] mt-3 leading-relaxed">
            Evaluating venation pattern, margin serration, pigment vigor, and growth habit to compile your species dossier and care schedule.
          </p>
          <div className="mt-6 h-1 w-full bg-[#e5dec9] overflow-hidden rounded-full">
            <div className="h-full w-1/2 bg-[#14532d] animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section id="care-guide" className="border-t border-[#e5dec9] pt-12 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <p className="font-mono text-xs uppercase tracking-widest text-[#78716c]">
              Care Monograph
            </p>
            <h2 className="font-serif text-3xl font-medium text-[#1c1917] mt-2">
              Awaiting Specimen Plate
            </h2>
          </div>
          <div className="lg:col-span-7 text-sm text-[#57534e] leading-relaxed max-w-2xl">
            Upload a photograph or select one of the four curated reference plates above to generate a complete botanical dossier. Each analysis returns binomial taxonomy, differential lookalikes, a visual health inspection, and exact parameters for light, watering cadence, substrate pH, humidity, fertilization, and toxicity.
          </div>
        </div>
      </section>
    );
  }

  if (!result.isPlant) {
    return (
      <section id="care-guide" className="border-t border-[#e5dec9] pt-12 pb-8">
        <div className="bg-[#f4f0e8] border border-[#dcd4c0] rounded-lg p-8 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-widest text-[#b45309]">
            ▲ Specimen Not Botanical
          </p>
          <h2 className="font-serif text-2xl font-medium text-[#1c1917] mt-2">
            No living plant species detected in this frame
          </h2>
          <p className="text-sm text-[#44403c] mt-3 leading-relaxed">
            {result.nonPlantReason ||
              'The uploaded photograph does not clearly show plant foliage, stems, or flowers.'}
          </p>
          <button
            type="button"
            onClick={onResetUpload}
            className="mt-5 px-4 py-2 text-xs font-semibold bg-[#14532d] text-[#fbf9f5] rounded-md hover:bg-[#166534] transition-colors cursor-pointer"
          >
            Upload Another Photograph
          </button>
        </div>
      </section>
    );
  }

  const healthMarker = formatHealthMarker(result.healthAssessment.status);

  return (
    <section id="care-guide" className="border-t border-[#e5dec9] pt-12 pb-10">
      {/* Taxonomy & Confidence Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#dcd4c0]">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono text-[#78716c]">
            <span>{result.family}</span>
            <span aria-hidden="true">·</span>
            <span>{result.plantType}</span>
            <span aria-hidden="true">·</span>
            <span>Native to {result.origin}</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1c1917] mt-2.5 tracking-tight">
            {result.commonName}
          </h2>
          <p className="font-serif italic text-xl text-[#44403c] mt-1">
            {result.scientificName}
          </p>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="text-left lg:text-right">
            <span className="block font-mono text-[11px] uppercase tracking-wider text-[#78716c]">
              Match Confidence
            </span>
            <span className="font-mono tabular-nums text-2xl font-medium text-[#1c1917]">
              {Math.round(result.confidence)}%
            </span>
          </div>

          <button
            type="button"
            onClick={onSaveSpecimen}
            disabled={isSaved}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d] ${
              isSaved
                ? 'bg-[#ebe6db] text-[#14532d] border-[#c7bea9] cursor-default'
                : 'bg-[#14532d] text-[#fbf9f5] border-[#14532d] hover:bg-[#166534]'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved in Log' : 'Save to Herbarium'}
          </button>
        </div>
      </div>

      {/* Diagnostic Inspection & Morphology */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-b border-[#dcd4c0]">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
                Visual Health Inspection
              </span>
              <span className={`text-xs font-semibold ${healthMarker.colorClass}`}>
                {healthMarker.glyph} {result.healthAssessment.status}
              </span>
            </div>
            <p className="text-base text-[#1c1917] font-medium mt-2 leading-relaxed">
              {result.healthAssessment.summary}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-[#44403c]">
              {result.healthAssessment.observations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-[#78716c] mt-0.5 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-5 border-t border-[#e5dec9]">
            <h3 className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              Morphological Basis
            </h3>
            <p className="text-sm text-[#44403c] mt-2 leading-relaxed max-w-2xl">
              {result.morphologicalNotes}
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 lg:border-l lg:border-[#e5dec9] lg:pl-8">
          <h3 className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
            Differential Lookalikes
          </h3>
          {result.alternativeMatches.length > 0 ? (
            <dl className="mt-3 divide-y divide-[#e5dec9]">
              {result.alternativeMatches.map((alt) => (
                <div key={alt.scientificName} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm font-semibold text-[#1c1917]">
                      {alt.commonName}{' '}
                      <span className="font-serif italic font-normal text-[#57534e]">
                        ({alt.scientificName})
                      </span>
                    </dt>
                    <dd className="font-mono tabular-nums text-xs text-[#78716c] shrink-0">
                      {Math.round(alt.confidence)}%
                    </dd>
                  </div>
                  <p className="text-xs text-[#57534e] mt-1 leading-relaxed">
                    {alt.distinguishingFeature}
                  </p>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-[#57534e] mt-3">
              No close morphological lookalikes flagged for this specimen.
            </p>
          )}
        </div>
      </div>

      {/* Cultivation & Care Parameters */}
      <div className="py-8 border-b border-[#dcd4c0]">
        <div className="mb-6">
          <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
            Cultivation Protocol
          </p>
          <h3 className="font-serif text-2xl font-semibold text-[#1c1917] mt-1">
            Species Care Instructions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[#dcd4c0] bg-[#f4f0e8]/60">
          <div className="p-6 border-r border-b border-[#dcd4c0]">
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              01. Light Exposure
            </p>
            <p className="text-lg font-semibold text-[#1c1917] mt-2">
              {result.careGuide.light.level}
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              {result.careGuide.light.hoursPerDay}
            </p>
            <p className="text-sm text-[#44403c] mt-3 leading-relaxed">
              {result.careGuide.light.placement}
            </p>
          </div>

          <div className="p-6 border-r border-b border-[#dcd4c0]">
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              02. Hydration Cadence
            </p>
            <p className="text-lg font-semibold text-[#1c1917] mt-2">
              {result.careGuide.water.frequency}
            </p>
            <p className="font-mono text-xs text-[#14532d] mt-1">
              {result.careGuide.water.soilMoistureCue}
            </p>
            <p className="text-sm text-[#44403c] mt-3 leading-relaxed">
              {result.careGuide.water.method}
            </p>
          </div>

          <div className="p-6 border-r border-b border-[#dcd4c0]">
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              03. Substrate &amp; pH
            </p>
            <p className="text-lg font-semibold text-[#1c1917] mt-2">
              {result.careGuide.soil.mix}
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              pH {result.careGuide.soil.pHRange}
            </p>
            <p className="text-sm text-[#44403c] mt-3 leading-relaxed">
              {result.careGuide.soil.drainage}
            </p>
          </div>

          <div className="p-6 border-r border-b border-[#dcd4c0]">
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              04. Temperature &amp; Humidity
            </p>
            <p className="font-mono tabular-nums text-lg font-semibold text-[#1c1917] mt-2">
              {result.careGuide.climate.tempRangeC}{' '}
              <span className="text-sm font-normal text-[#57534e]">
                ({result.careGuide.climate.tempRangeF})
              </span>
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              Relative humidity {result.careGuide.climate.humidityRange}
            </p>
            <p className="text-sm text-[#44403c] mt-3 leading-relaxed">
              Avoid sudden cold drafts and direct radiator airflow to preserve leaf turgor.
            </p>
          </div>

          <div className="p-6 border-r border-b border-[#dcd4c0]">
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              05. Fertilization
            </p>
            <p className="text-lg font-semibold text-[#1c1917] mt-2">
              {result.careGuide.fertilizer.schedule}
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              NPK {result.careGuide.fertilizer.npkRatio}
            </p>
            <p className="text-sm text-[#44403c] mt-3 leading-relaxed">
              {result.careGuide.fertilizer.seasonalNote}
            </p>
          </div>

          <div className="p-6 border-r border-b border-[#dcd4c0]">
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              06. Pruning &amp; Propagation
            </p>
            <p className="text-lg font-semibold text-[#1c1917] mt-2">
              {result.careGuide.pruningAndRepotting.propagationMethod}
            </p>
            <p className="font-mono text-xs text-[#14532d] mt-1">
              Repot {result.careGuide.pruningAndRepotting.repottingFrequency}
            </p>
            <p className="text-sm text-[#44403c] mt-3 leading-relaxed">
              {result.careGuide.pruningAndRepotting.pruning}
            </p>
          </div>
        </div>

        {/* Toxicity & Safety Strip */}
        <div className="mt-6 pt-5 border-t border-[#e5dec9] grid grid-cols-1 md:grid-cols-12 gap-4 text-sm">
          <div className="md:col-span-3">
            <span className="font-mono text-xs uppercase tracking-wider text-[#78716c] block">
              Toxicity &amp; Handling
            </span>
          </div>
          <div className="md:col-span-9 space-y-1 text-[#44403c]">
            <p>
              <strong className="font-semibold text-[#1c1917]">Pets:</strong> {result.toxicity.pets}{' '}
              <span className="mx-2 text-[#a8a29e]" aria-hidden="true">·</span>
              <strong className="font-semibold text-[#1c1917]">Humans:</strong> {result.toxicity.humans}
            </p>
            <p className="text-xs text-[#57534e]">{result.toxicity.note}</p>
          </div>
        </div>
      </div>

      {/* Symptom Troubleshooter */}
      <div className="py-8 border-b border-[#dcd4c0]">
        <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
          Diagnostic Reference
        </p>
        <h3 className="font-serif text-2xl font-semibold text-[#1c1917] mt-1 mb-5">
          Common Symptoms &amp; Remedies
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#d6cebe] text-xs font-mono uppercase tracking-wider text-[#78716c]">
                <th className="py-3 pr-6 font-medium">Observed Symptom</th>
                <th className="py-3 pr-6 font-medium">Primary Cause</th>
                <th className="py-3 font-medium">Corrective Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5dec9] text-sm">
              {result.commonIssues.map((issue, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-4 pr-6 font-semibold text-[#1c1917] min-w-[180px]">
                    {issue.symptom}
                  </td>
                  <td className="py-4 pr-6 text-[#44403c] min-w-[200px]">
                    {issue.cause}
                  </td>
                  <td className="py-4 text-[#44403c] leading-relaxed">
                    {issue.remedy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Horticultural Follow-Up Consultation */}
      <div className="pt-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              Specimen Consultation
            </p>
            <h3 className="font-serif text-2xl font-semibold text-[#1c1917] mt-1">
              Ask About This {result.commonName}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={isAsking}
              onClick={() => void handleAskQuestion(q)}
              className="px-3 py-1.5 text-xs font-medium text-[#44403c] bg-[#f4f0e8] border border-[#dcd4c0] rounded-md hover:border-[#14532d] hover:text-[#1c1917] transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {chatHistory.length > 0 && (
          <div className="mb-4 border border-[#dcd4c0] rounded-md divide-y divide-[#e5dec9] bg-[#fbf9f5]">
            {chatHistory.map((msg, i) => (
              <div key={i} className="p-4 text-sm">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#78716c] block mb-1">
                  {msg.role === 'user' ? 'Your Question' : 'Botanist Response'}
                </span>
                <p className="text-[#1c1917] leading-relaxed whitespace-pre-line">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>
        )}

        {chatError && (
          <div className="mb-3 p-3 text-xs text-[#991b1b] bg-[#fef2f2] border border-[#fecaca] rounded-md">
            {chatError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleAskQuestion(questionInput);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder={`Ask a specific question about caring for ${result.scientificName}...`}
            className="flex-1 px-4 py-2.5 text-sm bg-[#fbf9f5] text-[#1c1917] placeholder:text-[#a8a29e] border border-[#d6cebe] rounded-md focus:outline-none focus:border-[#14532d]"
          />
          <button
            type="submit"
            disabled={isAsking || !questionInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#14532d] text-[#fbf9f5] rounded-md hover:bg-[#166534] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            {isAsking ? 'Consulting...' : 'Ask Botanist'}
          </button>
        </form>
      </div>
    </section>
  );
}
