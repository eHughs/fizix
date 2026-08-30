import Image from "next/image";

interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
}

export default function BrandLogo({ size = 42, showWordmark = true, compact = false }: BrandLogoProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div
        className="brand-logo-plate grid shrink-0 place-items-center overflow-hidden rounded-[28%] border border-amber-500/20 bg-amber-400/[0.07] shadow-sm shadow-black/10"
        style={{ width: size, height: size }}
      >
        <Image
          src="/trader-analytics-logo.svg"
          alt="Trader Analytics"
          width={size}
          height={size}
          priority
          className="h-[88%] w-[88%] object-contain"
        />
      </div>
      {showWordmark ? (
        <div className="min-w-0">
          <p className={`${compact ? "text-sm" : "text-[15px]"} truncate font-bold tracking-[-0.025em] text-slate-50`}>
            Trader Analytics
          </p>
          <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Performance OS
          </p>
        </div>
      ) : null}
    </div>
  );
}
