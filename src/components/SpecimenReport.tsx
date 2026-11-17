import { useState } from 'react';
import { Bookmark, Check, Send } from 'lucide-react';
import type {
  CareChatMessage,
  GrowingEnvironment,
  HealthStatus,
  PlantIdentificationResult,
} from '../types/plant';

interface SpecimenReportProps {
  result: PlantIdentificationResult | null;
  environment: GrowingEnvironment;
  isAnalyzing: boolean;
  isSaved: boolean;
  specimenImageBase64?: string;
  specimenMimeType?: string;
  onSavePlant: () => void;
  onResetUpload: () => void;
}

function getHealthMarker(status: HealthStatus): { glyph: string; colorClass: string } {
  switch (status) {
    case 'Healthy':
      return { glyph: '●', colorClass: 'text-emerald-700' };
    case 'Mild Stress':
    case 'Needs Attention':
      return { glyph: '▲', colorClass: 'text-amber-700' };
    case 'Critical':
      return { glyph: '✖', colorClass: 'text-red-700' };
    default:
      return { glyph: '●', colorClass: 'text-slate-600' };
  }
}

const FOLLOW_UP_PROMPTS = [
  'How do I propagate this plant cleanly?',
  'What pot size and drainage holes work best?',
  'How should I adjust care during winter?',
];

export function SpecimenReport({
  result,
  environment,
  isAnalyzing,
  isSaved,
  specimenImageBase64,
  specimenMimeType,
  onSavePlant,
  onResetUpload,
}: SpecimenReportProps) {
  const [chatHistory, setChatHistory] = useState<CareChatMessage[]>([]);
  const [questionInput, setQuestionInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  const askBotanist = async (rawQuestion: string) => {
    const trimmed = rawQuestion.trim();
    if (!trimmed || !result || isAsking) return;

    setChatError(null);
    const nextHistory: CareChatMessage[] = [...chatHistory, { role: 'user', text: trimmed }];
    setChatHistory(nextHistory);
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
          environment,
          imageBase64: specimenImageBase64,
          mimeType: specimenMimeType,
        }),
      });

      const data = (await response.json()) as { answer?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || 'Could not obtain care advice.');
      }

      setChatHistory([...nextHistory, { role: 'model', text: data.answer || '' }]);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to send question.');
    } finally {
      setIsAsking(false);
    }
  };

  if (isAnalyzing) {
    return (
      <section id="care-sheet" aria-live="polite" className="border-t border-slate-200 pt-12 pb-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
            Visual Classification Active
          </span>
          <h2 className="font-serif text-3xl font-semibold text-slate-900 mt-1.5">
            Evaluating leaf traits, taxonomy, and health cues...
          </h2>
          <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
            Checking morphological markers against botanical references and assembling care parameters tailored to {environment.toLowerCase()}.
          </p>
          <div className="mt-6 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-1/2 bg-[#14532d] animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (!result) {
    return (
      <section id="care-sheet" className="border-t border-slate-200 pt-12 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              Identification &amp; Care Sheet
            </span>
            <h2 className="font-serif text-3xl font-semibold text-slate-900 mt-1">
              Ready for Specimen Analysis
            </h2>
          </div>
          <div className="lg:col-span-7 text-sm text-slate-600 leading-relaxed max-w-2xl">
            Submit a photograph above or pick any sample plate below to receive a complete species identification report, visual foliage diagnosis, watering interval, substrate pH target, 4-season care calendar, and toxicity guidance.
          </div>
        </div>
      </section>
    );
  }

  if (!result.isPlant) {
    return (
      <section id="care-sheet" className="border-t border-slate-200 pt-12 pb-8">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 max-w-3xl">
          <span className="font-mono text-xs uppercase tracking-wider text-amber-700">
            ▲ Non-Botanical Frame
          </span>
          <h2 className="font-serif text-3xl font-semibold text-slate-900 mt-1.5">
            No plant specimen detected in this photograph
          </h2>
          <p className="text-sm text-slate-600 mt-2.5 leading-relaxed">
            {result.nonPlantReason ||
              'The uploaded photo does not clearly depict leaves, stems, flowers, or a recognizable botanical subject.'}
          </p>
          <button
            type="button"
            onClick={onResetUpload}
            className="mt-5 px-4 py-2 text-xs font-semibold bg-[#14532d] text-white rounded-md hover:bg-[#166534] transition-colors cursor-pointer"
          >
            Upload Another Photo
          </button>
        </div>
      </section>
    );
  }

  const healthMarker = getHealthMarker(result.healthAssessment.status);

  return (
    <section id="care-sheet" className="border-t border-slate-200 pt-12 pb-10">
      {/* Taxonomic Summary Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-slate-500">
            <span>{result.family}</span>
            <span aria-hidden="true">·</span>
            <span>Genus {result.genus}</span>
            <span aria-hidden="true">·</span>
            <span>{result.plantType}</span>
            <span aria-hidden="true">·</span>
            <span>Native to {result.origin}</span>
          </div>

          <h2 className="font-serif text-4xl sm:text-[2.75rem] leading-tight font-semibold text-slate-900 mt-2">
            {result.commonName}
          </h2>
          <p className="font-serif italic text-xl text-slate-600 mt-0.5">
            {result.scientificName}
            {result.synonyms.length > 0 && (
              <span className="not-italic text-sm text-slate-500 font-sans ml-3">
                Also known as {result.synonyms.join(', ')}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="text-left lg:text-right">
            <span className="block font-mono text-[11px] uppercase tracking-wider text-slate-500">
              Match Confidence
            </span>
            <span className="font-mono tabular-nums text-2xl font-semibold text-slate-900">
              {Math.round(result.confidence)}%
            </span>
          </div>

          <button
            type="button"
            onClick={onSavePlant}
            disabled={isSaved}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d] ${
              isSaved
                ? 'bg-emerald-50 text-[#14532d] border-emerald-200 cursor-default'
                : 'bg-[#14532d] text-white border-[#14532d] hover:bg-[#166534]'
            }`}
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {isSaved ? 'Saved in My Plants' : 'Save to My Plants'}
          </button>
        </div>
      </div>

      {/* Health Diagnosis & Morphological Traits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-8 border-b border-slate-200">
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
                Health Assessment
              </span>
              <span className={`text-xs font-semibold ${healthMarker.colorClass}`}>
                {healthMarker.glyph} {result.healthAssessment.status}
              </span>
            </div>
            <p className="text-base font-medium text-slate-900 mt-2 leading-relaxed">
              {result.healthAssessment.summary}
            </p>
            <p className="text-sm text-[#14532d] font-medium mt-2">
              Recommended next step: {result.healthAssessment.immediateAction}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {result.healthAssessment.observations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-xs text-slate-400 mt-0.5 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-5 border-t border-slate-200">
            <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500 mb-3">
              Key Morphological Traits Observed
            </h3>
            <dl className="divide-y divide-slate-200 border-t border-b border-slate-200 text-sm">
              {result.identifyingTraits.map((item, idx) => (
                <div key={idx} className="py-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <dt className="sm:col-span-4 font-semibold text-slate-900">{item.trait}</dt>
                  <dd className="sm:col-span-8 text-slate-600 leading-relaxed">{item.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="lg:col-span-5 lg:border-l lg:border-slate-200 lg:pl-8">
          <h3 className="font-mono text-xs uppercase tracking-wider text-slate-500">
            Similar &amp; Lookalike Species
          </h3>
          {result.alternativeMatches.length > 0 ? (
            <dl className="mt-3 divide-y divide-slate-200">
              {result.alternativeMatches.map((alt) => (
                <div key={alt.scientificName} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-sm font-semibold text-slate-900">
                      {alt.commonName}{' '}
                      <span className="font-serif italic font-normal text-slate-600">
                        ({alt.scientificName})
                      </span>
                    </dt>
                    <dd className="font-mono tabular-nums text-xs text-slate-500 shrink-0">
                      {Math.round(alt.confidence)}%
                    </dd>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {alt.distinguishingFeature}
                  </p>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-slate-500 mt-3">
              No close lookalikes flagged for this specimen.
            </p>
          )}
        </div>
      </div>

      {/* 6-Part Cultivation Protocol */}
      <div className="py-8 border-b border-slate-200">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              Care Instructions · {environment}
            </span>
            <h3 className="font-serif text-3xl font-semibold text-slate-900 mt-1">
              Cultivation Requirements
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-slate-200 bg-slate-50/70">
          <div className="p-6 border-r border-b border-slate-200">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              01. Light Exposure
            </span>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {result.careGuide.light.level}
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              {result.careGuide.light.hoursPerDay}
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {result.careGuide.light.placement}
            </p>
          </div>

          <div className="p-6 border-r border-b border-slate-200">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              02. Watering Schedule
            </span>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {result.careGuide.water.frequency}
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              ~Every {result.careGuide.water.recommendedIntervalDays} days · {result.careGuide.water.soilMoistureCue}
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {result.careGuide.water.method}
            </p>
          </div>

          <div className="p-6 border-r border-b border-slate-200">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              03. Soil &amp; pH
            </span>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {result.careGuide.soil.mix}
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              Target pH {result.careGuide.soil.pHRange}
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {result.careGuide.soil.drainage}
            </p>
          </div>

          <div className="p-6 border-r border-b border-slate-200">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              04. Climate &amp; Humidity
            </span>
            <p className="font-mono tabular-nums text-lg font-semibold text-slate-900 mt-2">
              {result.careGuide.climate.tempRangeC}{' '}
              <span className="text-sm font-normal text-slate-500">
                ({result.careGuide.climate.tempRangeF})
              </span>
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              Humidity {result.careGuide.climate.humidityRange}
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {result.careGuide.climate.airflowNote}
            </p>
          </div>

          <div className="p-6 border-r border-b border-slate-200">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              05. Feeding &amp; NPK
            </span>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {result.careGuide.fertilizer.schedule}
            </p>
            <p className="font-mono tabular-nums text-xs text-[#14532d] mt-1">
              NPK {result.careGuide.fertilizer.npkRatio}
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {result.careGuide.fertilizer.seasonalNote}
            </p>
          </div>

          <div className="p-6 border-r border-b border-slate-200">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              06. Pruning &amp; Propagation
            </span>
            <p className="text-lg font-semibold text-slate-900 mt-2">
              {result.careGuide.pruningAndRepotting.propagationMethod}
            </p>
            <p className="font-mono text-xs text-[#14532d] mt-1">
              Repot {result.careGuide.pruningAndRepotting.repottingFrequency}
            </p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              {result.careGuide.pruningAndRepotting.pruning}
            </p>
          </div>
        </div>

        {/* Toxicity & Safety */}
        <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4 text-sm">
          <div className="md:col-span-3">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              Toxicity &amp; Safety
            </span>
          </div>
          <div className="md:col-span-9 space-y-1 text-slate-600">
            <p>
              <strong className="font-semibold text-slate-900">Pets:</strong> {result.toxicity.pets}
              <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
              <strong className="font-semibold text-slate-900">Humans:</strong> {result.toxicity.humans}
            </p>
            <p className="text-xs text-slate-500">{result.toxicity.note}</p>
          </div>
        </div>
      </div>

      {/* 4-Season Care Calendar */}
      <div className="py-8 border-b border-slate-200">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Annual Cycle
        </span>
        <h3 className="font-serif text-3xl font-semibold text-slate-900 mt-1 mb-5">
          Seasonal Care Calendar
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-slate-200">
          {(
            [
              ['Spring', result.seasonalCalendar.spring],
              ['Summer', result.seasonalCalendar.summer],
              ['Autumn', result.seasonalCalendar.autumn],
              ['Winter', result.seasonalCalendar.winter],
            ] as const
          ).map(([season, guidance]) => (
            <div key={season} className="p-5 border-r border-b border-slate-200 bg-white">
              <span className="font-mono text-xs uppercase tracking-wider text-[#14532d] font-medium">
                {season}
              </span>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{guidance}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Common Issues Table */}
      <div className="py-8 border-b border-slate-200">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Troubleshooting
        </span>
        <h3 className="font-serif text-3xl font-semibold text-slate-900 mt-1 mb-5">
          Common Symptoms &amp; Remedies
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-300 font-mono text-xs uppercase tracking-wider text-slate-500">
                <th className="py-3 pr-6 font-medium">Symptom</th>
                <th className="py-3 pr-6 font-medium">Cause</th>
                <th className="py-3 font-medium">Remedy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {result.commonIssues.map((issue, idx) => (
                <tr key={idx} className="align-top">
                  <td className="py-4 pr-6 font-semibold text-slate-900 min-w-[180px]">
                    {issue.symptom}
                  </td>
                  <td className="py-4 pr-6 text-slate-600 min-w-[200px]">{issue.cause}</td>
                  <td className="py-4 text-slate-600 leading-relaxed">{issue.remedy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-Up Care Consultation */}
      <div className="pt-8">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
          Follow-Up Care Advisor
        </span>
        <h3 className="font-serif text-3xl font-semibold text-slate-900 mt-1 mb-4">
          Ask About This {result.commonName}
        </h3>

        <div className="flex flex-wrap gap-2 mb-4">
          {FOLLOW_UP_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              disabled={isAsking}
              onClick={() => void askBotanist(q)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-md hover:border-[#14532d] hover:text-[#14532d] transition-colors cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {chatHistory.length > 0 && (
          <div className="mb-4 border border-slate-200 rounded-md divide-y divide-slate-200 bg-slate-50">
            {chatHistory.map((msg, i) => (
              <div key={i} className="p-4 text-sm">
                <span className="font-mono text-[11px] uppercase tracking-wider text-slate-500 block mb-1">
                  {msg.role === 'user' ? 'Question' : 'Botanical Guidance'}
                </span>
                <p className="text-slate-900 leading-relaxed whitespace-pre-line">{msg.text}</p>
              </div>
            ))}
          </div>
        )}

        {chatError && (
          <div className="mb-3 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md">
            {chatError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void askBotanist(questionInput);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="text"
            value={questionInput}
            onChange={(e) => setQuestionInput(e.target.value)}
            placeholder={`Ask a specific question about caring for ${result.scientificName}...`}
            className="flex-1 px-4 py-2.5 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:outline-none focus:border-[#14532d]"
          />
          <button
            type="submit"
            disabled={isAsking || !questionInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#14532d] text-white rounded-md hover:bg-[#166534] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            {isAsking ? 'Sending...' : 'Ask Botanist'}
          </button>
        </form>
      </div>
    </section>
  );
}
