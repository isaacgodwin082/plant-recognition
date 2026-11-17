/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { SpecimenInput } from './components/SpecimenInput';
import { CareDossier } from './components/CareDossier';
import { SampleGallery } from './components/SampleGallery';
import { HerbariumLog } from './components/HerbariumLog';
import { SAMPLE_SPECIMENS } from './data/sampleSpecimens';
import {
  createThumbnailDataUrl,
  urlToNormalizedImage,
  type NormalizedImage,
} from './utils/image';
import type {
  PlantIdentificationResult,
  SampleSpecimen,
  SavedSpecimen,
} from './types/plant';

const STORAGE_KEY = 'folia-herbarium-log-v1';

export default function App() {
  const [selectedImage, setSelectedImage] = useState<NormalizedImage | null>(null);
  const [fieldNote, setFieldNote] = useState('');
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
  const [dossierKey, setDossierKey] = useState(0);
  const [isSavedCurrent, setIsSavedCurrent] = useState(false);
  const [savedSpecimens, setSavedSpecimens] = useState<SavedSpecimen[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedSpecimen[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSpecimens));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [savedSpecimens]);

  const runIdentification = async (image: NormalizedImage, note: string) => {
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
          notes: note,
        }),
      });

      const payload = (await response.json()) as PlantIdentificationResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'Species identification request failed.');
      }

      setResult(payload);
      setDossierKey((prev) => prev + 1);

      requestAnimationFrame(() => {
        const el = document.getElementById('care-guide');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Unable to analyze the plant photograph right now. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageSelected = (image: NormalizedImage) => {
    setSelectedImage(image);
    setActiveSampleId(null);
    setErrorMessage(null);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setActiveSampleId(null);
    setErrorMessage(null);
  };

  const handleAnalyze = () => {
    if (!selectedImage || isAnalyzing) return;
    void runIdentification(selectedImage, fieldNote);
  };

  const handleSelectSample = async (sample: SampleSpecimen) => {
    if (isAnalyzing) return;
    setActiveSampleId(sample.id);
    setErrorMessage(null);
    setFieldNote(sample.contextNote);

    try {
      const normalized = await urlToNormalizedImage(sample.imageUrl);
      setSelectedImage(normalized);
      await runIdentification(normalized, sample.contextNote);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to load reference plate.'
      );
    }
  };

  const handleSaveSpecimen = async () => {
    if (!result || !result.isPlant || !selectedImage || isSavedCurrent) return;

    const thumbnailDataUrl = await createThumbnailDataUrl(selectedImage.dataUrl, 320);
    const entry: SavedSpecimen = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      savedAt: new Date().toISOString(),
      thumbnailDataUrl,
      fieldNote,
      result,
    };

    setSavedSpecimens((prev) => [entry, ...prev]);
    setIsSavedCurrent(true);
  };

  const handleOpenSavedSpecimen = (item: SavedSpecimen) => {
    const base64 = item.thumbnailDataUrl.split(',')[1] ?? '';
    setSelectedImage({
      dataUrl: item.thumbnailDataUrl,
      base64,
      mimeType: 'image/jpeg',
    });
    setFieldNote(item.fieldNote);
    setActiveSampleId(null);
    setErrorMessage(null);
    setResult(item.result);
    setDossierKey((prev) => prev + 1);
    setIsSavedCurrent(true);

    const el = document.getElementById('care-guide');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRemoveSavedSpecimen = (id: string) => {
    setSavedSpecimens((prev) => prev.filter((item) => item.id !== id));
  };

  const handleHeaderUpload = () => {
    const el = document.getElementById('identify');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    fileInputRef.current?.click();
  };

  return (
    <div id="top" className="min-h-screen bg-[#fbf9f5] text-[#1c1917] flex flex-col">
      <Header onUploadClick={handleHeaderUpload} />

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 sm:px-8">
        {/* Hero & Specimen Identification Workbench */}
        <section id="identify" className="py-10 lg:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between py-1">
              <div>
                <p className="font-mono text-xs uppercase tracking-widest text-[#78716c]">
                  Botanical Taxonomy &amp; Care System
                </p>
                <h1 className="font-serif text-4xl sm:text-[2.75rem] leading-[1.12] font-semibold text-[#1c1917] mt-3 tracking-tight">
                  Identify any plant species from a single photograph.
                </h1>
                <p className="text-base text-[#44403c] mt-4 leading-relaxed max-w-xl">
                  Submit a leaf, stem, or flower photograph to determine binomial taxonomy, evaluate visible foliage vigor, and generate a calibrated cultivation schedule for light, hydration, substrate pH, and seasonal feeding.
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isAnalyzing}
                    onClick={() => void handleSelectSample(SAMPLE_SPECIMENS[0])}
                    className="px-4 py-2 text-xs font-semibold text-[#1c1917] bg-[#f4f0e8] border border-[#d6cebe] rounded-md hover:border-[#14532d] hover:text-[#14532d] disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Try Sample: Monstera Plate
                  </button>
                  <a
                    href="#reference-samples"
                    className="text-xs font-medium text-[#57534e] hover:text-[#1c1917] underline underline-offset-4 whitespace-nowrap"
                  >
                    Browse all 4 reference plates
                  </a>
                </div>
              </div>

              <dl className="mt-8 pt-6 border-t border-[#e5dec9] divide-y divide-[#e5dec9] text-sm">
                <div className="py-2.5 flex items-baseline justify-between gap-4">
                  <dt className="font-medium text-[#1c1917]">01. Morphological Recognition</dt>
                  <dd className="font-mono text-xs text-[#78716c] text-right">
                    Binomial name · Lookalikes
                  </dd>
                </div>
                <div className="py-2.5 flex items-baseline justify-between gap-4">
                  <dt className="font-medium text-[#1c1917]">02. Foliage Health Inspection</dt>
                  <dd className="font-mono text-xs text-[#78716c] text-right">
                    Chlorosis · Pests · Vigor
                  </dd>
                </div>
                <div className="py-2.5 flex items-baseline justify-between gap-4">
                  <dt className="font-medium text-[#1c1917]">03. Cultivation Protocol</dt>
                  <dd className="font-mono text-xs text-[#78716c] text-right">
                    Light · Water · Soil · NPK
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7">
              <SpecimenInput
                selectedImage={selectedImage}
                fieldNote={fieldNote}
                isAnalyzing={isAnalyzing}
                errorMessage={errorMessage}
                fileInputRef={fileInputRef}
                onImageSelected={handleImageSelected}
                onClearImage={handleClearImage}
                onFieldNoteChange={setFieldNote}
                onAnalyze={handleAnalyze}
              />
            </div>
          </div>
        </section>

        {/* Identification Dossier & Care Monograph */}
        <CareDossier
          key={dossierKey}
          result={result}
          isAnalyzing={isAnalyzing}
          isSaved={isSavedCurrent}
          specimenImageBase64={selectedImage?.base64}
          specimenMimeType={selectedImage?.mimeType}
          onSaveSpecimen={() => void handleSaveSpecimen()}
          onResetUpload={() => {
            handleClearImage();
            fileInputRef.current?.click();
          }}
        />

        {/* Sample Specimen Reference Plates */}
        <SampleGallery
          samples={SAMPLE_SPECIMENS}
          activeSampleId={activeSampleId}
          isAnalyzing={isAnalyzing}
          onSelectSample={(sample) => void handleSelectSample(sample)}
        />

        {/* Persistent Personal Herbarium Log */}
        <HerbariumLog
          specimens={savedSpecimens}
          onOpenSpecimen={handleOpenSavedSpecimen}
          onRemoveSpecimen={handleRemoveSavedSpecimen}
        />
      </main>

      <footer className="border-t border-[#e5dec9] bg-[#f4f0e8]/50">
        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#78716c]">
          <span className="font-serif text-sm text-[#1c1917]">Folia Herbarium</span>
          <span>
            Plant Species Recognition &amp; Horticultural Care Index · Verify toxic flora with local botanical authorities before ingestion.
          </span>
        </div>
      </footer>
    </div>
  );
}
