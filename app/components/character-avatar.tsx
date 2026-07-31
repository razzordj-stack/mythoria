type CharacterAvatarProps = {
    name: string;
    icon?: string;
    portraitKey?: string | null;
    size?: "md" | "lg" | "xl";
    className?: string;
};

const portraits: Record<string, { x: string; y: string }> = {
    human: { x: "0%", y: "0%" },
    elf: { x: "33.333%", y: "0%" },
    dwarf: { x: "66.667%", y: "0%" },
    orc: { x: "100%", y: "0%" },
    shadowborn: { x: "0%", y: "50%" },
    dragonkin: { x: "33.333%", y: "50%" },
    warrior: { x: "66.667%", y: "50%" },
    mage: { x: "100%", y: "50%" },
    ranger: { x: "0%", y: "100%" },
    rogue: { x: "33.333%", y: "100%" },
    paladin: { x: "66.667%", y: "100%" },
    necromancer: { x: "100%", y: "100%" },
};

const portraitAliases: Record<string, string> = {
    mensch: "human",
    zwerg: "dwarf",
    ork: "orc",
    krieger: "warrior",
    magier: "mage",
    waldlaeufer: "ranger",
    "waldläufer": "ranger",
    schurke: "rogue",
    nekromant: "necromancer",
};

const sizeClasses = {
    md: "h-20 w-20",
    lg: "h-24 w-24",
    xl: "h-28 w-28",
} as const;

export function CharacterAvatar({ name, portraitKey, size = "lg", className = "" }: CharacterAvatarProps) {
    const normalizedName = name.trim() || "Unbenannter Held";
    const normalizedKey = portraitKey?.trim().toLowerCase() ?? "";
    const portrait = portraits[portraitAliases[normalizedKey] ?? normalizedKey] ?? null;

    return <div role="img" aria-label={`Porträt von ${normalizedName}`} title={normalizedName} className={["relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--mythoria-border-gold)] bg-[#0b0e08] shadow-xl shadow-black/50 ring-4 ring-black/25",sizeClasses[size],className].join(" ")} style={portrait?{backgroundImage:"url('/characters/mythoria-character-atlas.png')",backgroundSize:"400% 300%",backgroundPosition:`${portrait.x} ${portrait.y}`,backgroundRepeat:"no-repeat"}:undefined}>{!portrait&&<span aria-hidden="true" className="font-fantasy text-xl font-black text-[var(--mythoria-gold-light)]">{getInitials(normalizedName)}</span>}<span aria-hidden="true" className="absolute inset-0 rounded-full bg-[linear-gradient(145deg,transparent_55%,rgba(0,0,0,.38))]" /></div>;
}

function getInitials(name: string) { return name.split(/\s+/).filter(Boolean).slice(0,2).map(word=>Array.from(word)[0]?.toUpperCase()).join("") || "?"; }

export function CharacterPortrait({ portraitKey, label, className = "" }: { portraitKey: string; label: string; className?: string }) {
    const portrait = portraits[portraitKey];
    return <span role="img" aria-label={`Porträt: ${label}`} className={["block shrink-0 overflow-hidden rounded-xl border border-[var(--mythoria-border-gold)] bg-[#0b0e08]",className].join(" ")} style={portrait?{backgroundImage:"url('/characters/mythoria-character-atlas.png')",backgroundSize:"400% 300%",backgroundPosition:`${portrait.x} ${portrait.y}`,backgroundRepeat:"no-repeat"}:undefined} />;
}
