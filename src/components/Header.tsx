interface HeaderProps {
  onUploadClick: () => void;
}

export function Header({ onUploadClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#fbf9f5]/95 backdrop-blur-sm border-b border-[#e5dec9]">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-serif text-xl font-semibold tracking-tight text-[#1c1917] whitespace-nowrap shrink-0"
        >
          Folia Herbarium
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#57534e]"
        >
          <a
            href="#identify"
            className="hover:text-[#1c1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Identify
          </a>
          <a
            href="#care-guide"
            className="hover:text-[#1c1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Care Guide
          </a>
          <a
            href="#specimen-log"
            className="hover:text-[#1c1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Specimen Log
          </a>
          <a
            href="#reference-samples"
            className="hover:text-[#1c1917] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Reference Samples
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onUploadClick}
            className="px-4 py-2 text-xs font-semibold tracking-wide bg-[#14532d] text-[#fbf9f5] rounded-md hover:bg-[#166534] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d]"
          >
            Upload Specimen
          </button>
        </div>
      </div>
    </header>
  );
}
