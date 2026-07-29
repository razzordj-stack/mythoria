import Link from "next/link";
import {MythoriaEmptyState} from "./MythoriaEmptyState";
import {MythoriaPageHeader} from "./MythoriaPageHeader";
export function MythoriaFeaturePlaceholder({eyebrow,title,description,icon="◇",backHref="/dashboard"}:{eyebrow:string;title:string;description:string;icon?:string;backHref?:string}){return <main className="mythoria-page mx-auto max-w-5xl px-4 py-8 sm:px-6"><MythoriaPageHeader eyebrow={eyebrow} title={title} description={description}/><MythoriaEmptyState className="mt-8" icon={icon} title="Bald verfügbar" description="Dieses Kapitel befindet sich im Aufbau. Es werden keine Platzhalterdaten angezeigt." action={<Link href={backHref} className="mythoria-button-secondary">Zurück zum Dashboard</Link>}/></main>}
