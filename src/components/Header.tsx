interface HeaderProps {
  onScanClick: () => void;
}

export function Header({ onScanClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-8">
        <a
          href="#top"
          className="font-serif text-2xl font-semibold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          Folia Herbarium
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#scanner"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Scanner
          </a>
          <a
            href="#care-sheet"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Care Sheet
          </a>
          <a
            href="#sample-plates"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Sample Plates
          </a>
          <a
            href="#my-plants"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            My Plants
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onScanClick}
            className="px-4 py-2 text-xs font-semibold tracking-wide bg-[#14532d] text-white rounded-md hover:bg-[#166534] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532d]"
          >
            Scan Plant
          </button>
        </div>
      </div>
    </header>
  );
}
