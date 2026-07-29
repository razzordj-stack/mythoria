import Image from "next/image";

type MythoriaEmblemProps = {
  size?: number;
  className?: string;
};

export function MythoriaEmblem({ size = 44, className = "" }: MythoriaEmblemProps) {
  return (
    <span
      className={[
        "relative inline-flex shrink-0 overflow-hidden rounded-xl border border-[var(--mythoria-border-gold)] bg-[var(--mythoria-black)] shadow-[0_0_20px_rgba(147,182,64,0.12)]",
        className,
      ].filter(Boolean).join(" ")}
      style={{ width: size, height: size }}
    >
      <Image
        src="/branding/mythoria-logo.png"
        alt="Mythoria – AI Dungeon Master"
        fill
        sizes={`${size}px`}
        className="scale-[1.7] object-cover object-[50%_22%]"
      />
    </span>
  );
}
