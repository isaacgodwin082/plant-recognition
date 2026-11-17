/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { ScannerWorkbench } from './components/ScannerWorkbench';
import { SpecimenReport } from './components/SpecimenReport';
import { SamplePlates } from './components/SamplePlates';
import { MyPlantsCollection } from './components/MyPlantsCollection';
import { SAMPLE_SPECIMENS } from './data/sampleSpecimens';
import {
  createThumbnailDataUrl,
  urlToNormalizedImage,
  type NormalizedImage,
} from './utils/image';
import type {
  GrowingEnvironment,
  PlantIdentificationResult,
  PlantPartFocus,
  SampleSpecimen,
  SavedPlantEntry,
} from './types/plant';

const STORAGE_KEY = 'folia-herbarium-plants-v2';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<NormalizedImage | null>(null);
  const [partFocus, setPartFocus] = useState<PlantPartFocus>('Whole Plant');
  const [environment, setEnvironment] = useState<GrowingEnvironment>('Indoor Houseplant');
  const [fieldNote, setFieldNote] = useState('');
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const [reportKey, setReportKey] = useState(0);
  const [isSavedCurrent, setIsSavedCurrent] = useState(false);

  const [savedPlants, setSavedPlants] = useState<SavedPlantEntry[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedPlantEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlants));
    } catch {
      // Ignore storage quota issues
    }
  }, [savedPlants]);

  const runIdentification = async (
    image: NormalizedImage,
    focus: PlantPartFocus,
    env: GrowingEnvironment,
    note: string
  ) => {
    setIsAnalyzing(true);
    setErrorMessage(null);
    setIsSavedCurrent(false);

    try {
      const response = await fetch('/api/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image.base64,
          mimeType: image.mimeType,
          partFocus: focus,
          environment: env,
          notes: note,
        }),
      });

      const payload = (await response.json()) as PlantIdentificationResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Plant identification failed.');
      }

      setResult(payload);
      setReportKey((k) => k + 1);

      requestAnimationFrame(() => {
        document.getElementById('care-sheet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to analyze the plant photo right now. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectSample = async (sample: SampleSpecimen) => {
    if (isAnalyzing) return;
    setActiveSampleId(sample.id);
    setPartFocus(sample.partFocus);
    setEnvironment(sample.environment);
    setFieldNote(sample.contextNote);
    setErrorMessage(null);

    try {
      const normalized = await urlToNormalizedImage(sample.imageUrl);
      setSelectedImage(normalized);
      await runIdentification(normalized, sample.partFocus, sample.environment, sample.contextNote);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load sample plate.');
    }
  };

  const handleSavePlant = async () => {
    if (!result || !result.isPlant || !selectedImage || isSavedCurrent) return;
    const thumbnailDataUrl = await createThumbnailDataUrl(selectedImage.dataUrl, 320);
    const now = new Date().toISOString();

    const entry: SavedPlantEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: now,
      lastWateredAt: now,
      thumbnailDataUrl,
      environment,
      fieldNote,
      result,
    };

    setSavedPlants((prev) => [entry, ...prev]);
    setIsSavedCurrent(true);
  };

  const handleOpenSavedPlant = (entry: SavedPlantEntry) => {
    const base64 = entry.thumbnailDataUrl.split(',')[1] ?? '';
    setSelectedImage({
      dataUrl: entry.thumbnailDataUrl,
      base64,
      mimeType: 'image/jpeg',
    });
    setEnvironment(entry.environment);
    setFieldNote(entry.fieldNote);
    setActiveSampleId(null);
    setErrorMessage(null);
    setResult(entry.result);
    setReportKey((k) => k + 1);
    setIsSavedCurrent(true);

    document.getElementById('care-sheet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleMarkWatered = (id: string) => {
    const now = new Date().toISOString();
    setSavedPlants((prev) =>
      prev.map((item) => (item.id === id ? { ...item, lastWateredAt: now } : item))
    );
  };

  const handleRemovePlant = (id: string) => {
    setSavedPlants((prev) => prev.filter((item) => item.id !== id));
  };

  const handleHeaderScan = () => {
    document.getElementById('scanner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    fileInputRef.current?.click();
  };

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 flex flex-col">
      <Header onScanClick={handleHeaderScan} />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 sm:px-8">
        {/* Hero & Scanner Split */}
        <section id="scanner" className="py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between py-1">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                  Plant Species Recognition &amp; Care
                </span>
                <h1 className="font-serif text-4xl sm:text-5xl leading-[1.08] font-semibold text-slate-900 mt-3 tracking-tight">
                  Recognize any plant species and tailor its care.
                </h1>
                <p className="text-base text-slate-600 mt-4 leading-relaxed max-w-xl">
                  Upload, paste, or snap a plant photograph to identify its binomial species, inspect foliage health, and generate a complete care schedule covering light, watering cadence, soil pH, and seasonal adjustments.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => void handleSelectSample(SAMPLE_SPECIMENS[0])}
                    className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-md hover:border-[#14532d] hover:text-[#14532d] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Try Sample: Echeveria Succulent
                  </button>
                  <a
                    href="#sample-plates"
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap"
                  >
                    View all 4 reference plates
                  </a>
                </div>
              </div>

              <dl className="mt-8 pt-6 border-t border-slate-200 divide-y divide-slate-200 text-sm">
                <div className="py-2.5 flex items-baseline justify-between gap-4">
                  <dt className="font-medium text-slate-900">01. Species Identification</dt>
                  <dd className="font-mono text-xs text-slate-500 text-right">
                    Traits · Binomial · Lookalikes
                  </dd>
                </div>
                <div className="py-2.5 flex items-baseline justify-between gap-4">
                  <dt className="font-medium text-slate-900">02. Foliage Health Check</dt>
                  <dd className="font-mono text-xs text-slate-500 text-right">
                    Stress · Pests · Next Action
                  </dd>
                </div>
                <div className="py-2.5 flex items-baseline justify-between gap-4">
                  <dt className="font-medium text-slate-900">03. Seasonal Care &amp; Tracking</dt>
                  <dd className="font-mono text-xs text-slate-500 text-right">
                    Light · Water · pH · Calendar
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7">
              <ScannerWorkbench
                selectedImage={selectedImage}
                partFocus={partFocus}
                environment={environment}
                fieldNote={fieldNote}
                isAnalyzing={isAnalyzing}
                errorMessage={errorMessage}
                fileInputRef={fileInputRef}
                onImageSelected={(img) => {
                  setSelectedImage(img);
                  setActiveSampleId(null);
                  setErrorMessage(null);
                }}
                onClearImage={() => {
                  setSelectedImage(null);
                  setActiveSampleId(null);
                  setErrorMessage(null);
                }}
                onPartFocusChange={setPartFocus}
                onEnvironmentChange={setEnvironment}
                onFieldNoteChange={setFieldNote}
                onAnalyze={() => {
                  if (selectedImage && !isAnalyzing) {
                    void runIdentification(selectedImage, partFocus, environment, fieldNote);
                  }
                }}
              />
            </div>
          </div>
        </section>

        {/* Identification & Care Sheet */}
        <SpecimenReport
          key={reportKey}
          result={result}
          environment={environment}
          isAnalyzing={isAnalyzing}
          isSaved={isSavedCurrent}
          specimenImageBase64={selectedImage?.base64}
          specimenMimeType={selectedImage?.mimeType}
          onSavePlant={() => void handleSavePlant()}
          onResetUpload={() => {
            setSelectedImage(null);
            setActiveSampleId(null);
            fileInputRef.current?.click();
          }}
        />

        {/* Sample Specimen Plates */}
        <SamplePlates
          samples={SAMPLE_SPECIMENS}
          activeSampleId={activeSampleId}
          isAnalyzing={isAnalyzing}
          onSelectSample={(sample) => void handleSelectSample(sample)}
        />

        {/* Saved Plants & Watering Tracker */}
        <MyPlantsCollection
          plants={savedPlants}
          onOpenPlant={handleOpenSavedPlant}
          onMarkWatered={handleMarkWatered}
          onRemovePlant={handleRemovePlant}
        />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <span className="font-serif text-base font-semibold text-slate-900">Folia Herbarium</span>
          <span>
            Botanical Recognition &amp; Care System · Always verify toxic or edible species with a local authority before consumption.
          </span>
        </div>
      </footer>
    </div>
  );
}
