import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Search, SwitchCamera, X } from 'lucide-react';
import { fileToNormalizedImage, type NormalizedImage } from '../utils/image';
import type { GrowingEnvironment, PlantPartFocus } from '../types/plant';

const PART_FOCUSES: PlantPartFocus[] = [
  'Whole Plant',
  'Foliage',
  'Flower',
  'Stem & Bark',
  'Spot or Pest',
];

const ENVIRONMENTS: GrowingEnvironment[] = [
  'Indoor Houseplant',
  'Outdoor Garden',
  'Patio or Greenhouse',
  'Wild or Field',
];

interface ScannerWorkbenchProps {
  selectedImage: NormalizedImage | null;
  partFocus: PlantPartFocus;
  environment: GrowingEnvironment;
  fieldNote: string;
  isAnalyzing: boolean;
  errorMessage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageSelected: (image: NormalizedImage) => void;
  onClearImage: () => void;
  onPartFocusChange: (focus: PlantPartFocus) => void;
  onEnvironmentChange: (env: GrowingEnvironment) => void;
  onFieldNoteChange: (note: string) => void;
  onAnalyze: () => void;
}

export function ScannerWorkbench({
  selectedImage,
  partFocus,
  environment,
  fieldNote,
  isAnalyzing,
  errorMessage,
  fileInputRef,
  onImageSelected,
  onClearImage,
  onPartFocusChange,
  onEnvironmentChange,
  onFieldNoteChange,
  onAnalyze,
}: ScannerWorkbenchProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setImgFailed(false);
  }, [selectedImage?.dataUrl]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            void handleFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  });

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const openCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    setLocalError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live camera access is unavailable in this browser. Upload an image file instead.');
      return;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setFacingMode(mode);
      setIsCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError('Camera access was declined or no camera was detected. You can drop or browse a photo file.');
    }
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    const base64 = dataUrl.split(',')[1] ?? '';
    stopCamera();
    onImageSelected({ dataUrl, base64, mimeType: 'image/jpeg' });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setCameraError(null);
    try {
      const normalized = await fileToNormalizedImage(file);
      onImageSelected(normalized);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to read that image file.');
    }
  };

  const displayError = errorMessage || localError || cameraError;

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-slate-500">
              Specimen Input
            </span>
            <h2 className="font-serif text-2xl font-semibold text-slate-900 mt-0.5">
              Upload, Paste, or Capture Photo
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCameraOpen ? (
              <>
                <button
                  type="button"
                  onClick={() => void openCamera(facingMode === 'environment' ? 'user' : 'environment')}
                  aria-label="Switch camera lens"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <SwitchCamera className="w-3.5 h-3.5" />
                  Flip
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <X className="w-3.5 h-3.5" />
                  Close
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void openCamera()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5" />
                Use Camera
              </button>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {/* Viewport / Dropzone */}
        <div className="mt-5">
          {isCameraOpen ? (
            <div className="relative aspect-[4/3] w-full bg-slate-950 rounded-md overflow-hidden border border-slate-300">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-4">
                <span className="text-xs text-white/90">
                  Fill the frame with leaves, flowers, or stems in clear light
                </span>
                <button
                  type="button"
                  onClick={captureFrame}
                  className="px-4 py-2 text-xs font-semibold bg-white text-slate-900 rounded-md hover:bg-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Capture Photo
                </button>
              </div>
            </div>
          ) : selectedImage ? (
            <div className="relative aspect-[4/3] w-full bg-slate-100 rounded-md overflow-hidden border border-slate-200">
              {!imgFailed ? (
                <img
                  src={selectedImage.dataUrl}
                  alt="Plant specimen ready for identification"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-500">
                  <ImagePlus className="w-8 h-8 mb-2 opacity-60" />
                  <span className="text-sm font-medium">Preview unavailable</span>
                </div>
              )}

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium bg-white/95 text-slate-900 border border-slate-300 rounded-md hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  Change Photo
                </button>
                <button
                  type="button"
                  onClick={onClearImage}
                  aria-label="Clear photo"
                  className="p-1.5 bg-white/95 text-slate-900 border border-slate-300 rounded-md hover:bg-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                void handleFile(e.dataTransfer.files?.[0]);
              }}
              className={`aspect-[4/3] w-full rounded-md border border-dashed transition-colors flex flex-col items-center justify-center p-6 text-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d] ${
                isDragging
                  ? 'border-[#14532d] bg-emerald-50/50'
                  : 'border-slate-300 bg-white hover:border-[#14532d]'
              }`}
            >
              <ImagePlus className="w-8 h-8 text-[#14532d] mb-3 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-900">
                Drop a plant photo here, browse files, or paste (Ctrl+V)
              </p>
              <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                Close-up shots of leaf shape, flower petals, or stressed spots produce the most accurate species and health diagnosis.
              </p>
              <span className="mt-4 font-mono text-[11px] text-slate-400">
                JPEG · PNG · WebP · Auto-optimized client-side
              </span>
            </div>
          )}
        </div>

        {/* Recognition Context Selectors */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-xs font-medium text-slate-700 mb-1.5">
              Photo Subject
            </span>
            <div className="flex flex-wrap gap-1 p-1 bg-slate-200/70 rounded-md">
              {PART_FOCUSES.map((focus) => (
                <button
                  key={focus}
                  type="button"
                  onClick={() => onPartFocusChange(focus)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                    partFocus === focus
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {focus}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="growing-env" className="block text-xs font-medium text-slate-700 mb-1.5">
              Growing Environment
            </label>
            <select
              id="growing-env"
              value={environment}
              onChange={(e) => onEnvironmentChange(e.target.value as GrowingEnvironment)}
              className="w-full px-3 py-2 text-xs font-medium bg-white text-slate-900 border border-slate-300 rounded-md focus:outline-none focus:border-[#14532d]"
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="specimen-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
            Observations or Symptoms (optional)
          </label>
          <input
            id="specimen-notes"
            type="text"
            value={fieldNote}
            onChange={(e) => onFieldNoteChange(e.target.value)}
            placeholder="e.g., Leaf tips browning, sits 1m from south window, soil stays damp"
            className="w-full px-3.5 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-md focus:outline-none focus:border-[#14532d]"
          />
        </div>

        {displayError && (
          <div
            role="alert"
            className="mt-4 p-3 text-xs text-red-800 bg-red-50 border border-red-200 rounded-md"
          >
            {displayError}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
        <span className="text-xs text-slate-500">
          {selectedImage ? 'Image loaded · Ready to identify' : 'Upload a photo or select a sample plate below'}
        </span>
        <button
          type="button"
          disabled={!selectedImage || isAnalyzing}
          onClick={onAnalyze}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#14532d] text-white rounded-md hover:bg-[#166534] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d]"
        >
          <Search className="w-4 h-4" />
          {isAnalyzing ? 'Identifying...' : 'Identify Plant'}
        </button>
      </div>
    </div>
  );
}
