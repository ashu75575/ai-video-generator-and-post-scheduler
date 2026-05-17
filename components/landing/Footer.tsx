import { Scissors } from "lucide-react";

const COLS = [
  {
    heading: "Product",
    links: ["Features", "How it works", "Pricing", "Changelog", "Roadmap"],
  },
  {
    heading: "Developers",
    links: ["Documentation", "SDK Reference", "API Status", "GitHub", "Examples"],
  },
  {
    heading: "Company",
    links: ["About", "Blog", "Careers", "Press kit", "Contact"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/6 px-6 pt-[60px] pb-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-15 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] lg:gap-12">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-gradient-forge">
                <Scissors size={13} className="text-white" />
              </div>
              <span className="font-[family-name:var(--font-space-grotesk)] text-base font-bold text-white">
                ClipForge<span className="text-forge-accent">AI</span>
              </span>
            </div>
            <p className="max-w-[260px] font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-white/35">
              Turn any long-form video into viral short clips with AI. Built for
              creators.
            </p>
          </div>

          {COLS.map((col) => (
            <div key={col.heading}>
              <div className="mb-4 font-[family-name:var(--font-dm-sans)] text-xs font-bold tracking-wider text-white/50 uppercase">
                {col.heading}
              </div>
              {col.links.map((link) => (
                <a
                  key={link}
                  href="#"
                  className="mb-2.5 block font-[family-name:var(--font-dm-sans)] text-sm text-white/35 no-underline transition-colors hover:text-white/75"
                >
                  {link}
                </a>
              ))}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/6 pt-7">
          <span className="font-[family-name:var(--font-dm-sans)] text-[13px] text-white/25">
            © 2026 ClipForge AI Inc. All rights reserved.
          </span>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((label) => (
              <a
                key={label}
                href="#"
                className="font-[family-name:var(--font-dm-sans)] text-[13px] text-white/25 no-underline"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
