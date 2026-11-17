import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RotateCcw, Search, X } from 'lucide-react';
import { fileToNormalizedImage, type NormalizedImage } from '../utils/image';

interface SpecimenInputProps {
  selectedImage: NormalizedImage | null;
  fieldNote: string;
  isAnalyzing: boolean;
  errorMessage: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onImageSelected: (image: NormalizedImage) => void;
  onClearImage: () => void;
  onFieldNoteChange: (value: string) => void;
  onAnalyze: () => void;
}

export function SpecimenInput({
  selectedImage,
  fieldNote,
  isAnalyzing,
  errorMessage,
  fileInputRef,
  onImageSelected,
  onClearImage,
  onFieldNoteChange,
  onAnalyze,
}: SpecimenInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [imgLoadFailed, setImgLoadFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setImgLoadFailed(false);
  }, [selectedImage?.dataUrl]);

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

  const startCamera = async () => {
    setCameraError(null);
    setLocalError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access is not supported in this browser. Please upload a photo instead.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setCameraError('Camera permission was declined or unavailable. You can upload an image file directly.');
    }
  };

  const captureFromCamera = () => {
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
    onImageSelected({
      dataUrl,
      base64,
      mimeType: 'image/jpeg',
    });
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setLocalError(null);
    setCameraError(null);
    try {
      const normalized = await fileToNormalizedImage(file);
      onImageSelected(normalized);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Unable to process image file.');
    }
  };

  const displayError = errorMessage || localError || cameraError;

  return (
    <div className="bg-[#f4f0e8] border border-[#dcd4c0] rounded-lg p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#dcd4c0]">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#78716c]">
              Specimen Acquisition
            </p>
            <h2 className="font-serif text-xl font-semibold text-[#1c1917] mt-1">
              Photograph or Upload Plant
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isCameraOpen ? (
              <button
                type="button"
                onClick={stopCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1c1917] bg-[#fbf9f5] border border-[#d6cebe] rounded-md hover:bg-[#ebe6db] transition-colors cursor-pointer whitespace-nowrap"
              >
                <X className="w-3.5 h-3.5" />
                Close Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={startCamera}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1c1917] bg-[#fbf9f5] border border-[#d6cebe] rounded-md hover:bg-[#ebe6db] transition-colors cursor-pointer whitespace-nowrap"
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

        <div className="mt-5">
          {isCameraOpen ? (
            <div className="relative aspect-[4/3] w-full bg-[#1c1917] rounded-md overflow-hidden border border-[#d6cebe]">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-4">
                <span className="text-xs text-[#fbf9f5]/90">
                  Center foliage or blossoms in natural light
                </span>
                <button
                  type="button"
                  onClick={captureFromCamera}
                  className="px-4 py-2 text-xs font-semibold bg-[#fbf9f5] text-[#1c1917] rounded-md hover:bg-[#ebe6db] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Capture Frame
                </button>
              </div>
            </div>
          ) : selectedImage ? (
            <div className="relative aspect-[4/3] w-full bg-[#ebe6db] rounded-md overflow-hidden border border-[#d6cebe]">
              {!imgLoadFailed ? (
                <img
                  src={selectedImage.dataUrl}
                  alt="Uploaded botanical specimen preview"
                  referrerPolicy="no-referrer"
                  onError={() => setImgLoadFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#57534e]">
                  <ImagePlus className="w-8 h-8 mb-2 opacity-60" />
                  <p className="text-sm font-medium">Specimen preview unavailable</p>
                </div>
              )}

              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium bg-[#fbf9f5]/95 text-[#1c1917] border border-[#d6cebe] rounded-md hover:bg-white transition-colors cursor-pointer whitespace-nowrap"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={onClearImage}
                  aria-label="Clear specimen photo"
                  className="p-1.5 bg-[#fbf9f5]/95 text-[#1c1917] border border-[#d6cebe] rounded-md hover:bg-white transition-colors cursor-pointer"
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
                  ? 'border-[#14532d] bg-[#14532d]/5'
                  : 'border-[#bdb4a0] bg-[#fbf9f5] hover:border-[#14532d]/70'
              }`}
            >
              <ImagePlus className="w-8 h-8 text-[#14532d] mb-3 stroke-[1.5]" />
              <p className="text-sm font-semibold text-[#1c1917]">
                Drop a plant photo here, or browse files
              </p>
              <p className="text-xs text-[#78716c] mt-1.5 max-w-xs leading-relaxed">
                Clear photos of leaves, stems, flowers, or bark yield the highest species accuracy.
              </p>
              <span className="mt-4 font-mono text-[11px] text-[#78716c]">
                JPEG · PNG · WebP · Auto-scaled for rapid analysis
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <label htmlFor="field-context" className="block text-xs font-medium text-[#44403c] mb-1.5">
            Field Context (optional)
          </label>
          <input
            id="field-context"
            type="text"
            value={fieldNote}
            onChange={(e) => onFieldNoteChange(e.target.value)}
            placeholder="e.g., Indoor east window, potting mix dries slowly, lower leaves yellowing"
            className="w-full px-3.5 py-2.5 text-sm bg-[#fbf9f5] text-[#1c1917] placeholder:text-[#a8a29e] border border-[#d6cebe] rounded-md focus:outline-none focus:border-[#14532d]"
          />
        </div>

        {displayError && (
          <div
            role="alert"
            className="mt-4 p-3 text-xs text-[#991b1b] bg-[#fef2f2] border border-[#fecaca] rounded-md"
          >
            {displayError}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[#dcd4c0] flex items-center justify-between gap-4">
        <span className="text-xs text-[#78716c]">
          {selectedImage ? 'Specimen ready for taxonomic scan' : 'Select a photo or pick a reference plate'}
        </span>
        <button
          type="button"
          disabled={!selectedImage || isAnalyzing}
          onClick={onAnalyze}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-[#14532d] text-[#fbf9f5] rounded-md hover:bg-[#166534] disabled:opacity-45 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d]"
        >
          <Search className="w-4 h-4" />
          {isAnalyzing ? 'Analyzing Specimen...' : 'Identify Species'}
        </button>
      </div>
    </div>
  );
}
