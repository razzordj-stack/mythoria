type CharacterAvatarProps = {
    name: string;
    icon?: string;
    size?: "md" | "lg" | "xl";
    className?: string;
};

const avatarThemes = [
    ["#7c3aed", "#c026d3"],
    ["#2563eb", "#7c3aed"],
    ["#059669", "#0891b2"],
    ["#d97706", "#dc2626"],
    ["#be185d", "#7c3aed"],
    ["#4f46e5", "#0f766e"],
] as const;

const sizeClasses = {
    md: "h-20 w-20 text-3xl",
    lg: "h-24 w-24 text-5xl",
    xl: "h-28 w-28 text-6xl",
} as const;

export function CharacterAvatar({
    name,
    icon = "✦",
    size = "lg",
    className = "",
}: CharacterAvatarProps) {
    const normalizedName = name.trim() || "Unbenannter Held";
    const themeIndex = Array.from(normalizedName).reduce(
        (total, character) => total + character.codePointAt(0)!,
        0,
    ) % avatarThemes.length;
    const [from, to] = avatarThemes[themeIndex];
    const initials = getInitials(normalizedName);

    return (
        <div
            role="img"
            aria-label={"Avatar von " + normalizedName}
            title={normalizedName}
            className={[
                "relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/25 shadow-xl shadow-black/40 ring-4 ring-black/20",
                sizeClasses[size],
                className,
            ].join(" ")}
            style={{
                backgroundImage:
                    "linear-gradient(135deg, " + from + ", " + to + ")",
            }}
        >
            <span
                aria-hidden="true"
                className="absolute inset-2 rounded-full border border-white/15 bg-black/15"
            />
            <span
                aria-hidden="true"
                className="absolute -right-4 -top-5 h-14 w-14 rounded-full bg-white/20 blur-xl"
            />
            <span aria-hidden="true" className="relative drop-shadow-lg">
                {icon}
            </span>
            <span
                aria-hidden="true"
                className="absolute bottom-0 right-0 flex min-h-7 min-w-7 items-center justify-center rounded-full border-2 border-[#0c0b1c] bg-white px-1 text-[9px] font-black tracking-tight text-slate-950"
            >
                {initials}
            </span>
        </div>
    );
}

function getInitials(name: string) {
    const words = name
        .split(/\s+/)
        .map((word) => word.trim())
        .filter(Boolean);

    if (words.length === 0) {
        return "?";
    }

    return words
        .slice(0, 2)
        .map((word) => Array.from(word)[0]?.toUpperCase())
        .join("");
}