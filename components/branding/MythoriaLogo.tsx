import Image from "next/image";

type MythoriaLogoProps = {
  size?: "small" | "medium" | "large" | "hero";
  priority?: boolean;
  showSubtitle?: boolean;
  className?: string;
};

const sizes = {
  small: { width: 150, sizes: "150px" },
  medium: { width: 230, sizes: "230px" },
  large: { width: 340, sizes: "(max-width: 420px) 82vw, 340px" },
  hero: { width: 520, sizes: "(max-width: 640px) 88vw, 520px" },
} as const;

export function MythoriaLogo({
  size = "medium",
  priority = false,
  showSubtitle = false,
  className = "",
}: MythoriaLogoProps) {
  const config = sizes[size];
  const hasGlow = size === "large" || size === "hero";

  return (
    <figure className={["inline-flex max-w-full flex-col items-center", className].filter(Boolean).join(" ")}>
      <Image
        src="/branding/mythoria-logo-new.png"
        alt="Mythoria – AI Dungeon Master"
        width={config.width}
        height={Math.round((config.width * 2) / 3)}
        sizes={config.sizes}
        preload={priority}
        className={[
          "h-auto max-w-full select-none object-contain",
          hasGlow ? "drop-shadow-[0_0_28px_rgba(147,182,64,0.14)]" : "",
        ].filter(Boolean).join(" ")}
      />
      {showSubtitle && (
        <figcaption className="mt-2 font-fantasy text-xs font-bold tracking-[0.24em] text-[var(--mythoria-gold-light)]">
          AI Dungeon Master
        </figcaption>
      )}
    </figure>
  );
}
