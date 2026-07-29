begin;
create table if not exists public.world_locations (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
 region text not null, biome text not null, summary text not null, description text not null,
 danger_level integer not null default 1, recommended_level integer not null default 1,
 status text not null default 'published', sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint world_locations_slug_format check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 constraint world_locations_name_length check(char_length(name) between 2 and 100),
 constraint world_locations_danger_range check(danger_level between 1 and 5),
 constraint world_locations_level_positive check(recommended_level>=1),
 constraint world_locations_status_allowed check(status in ('draft','published'))
);
create index if not exists world_locations_region_sort_idx on public.world_locations(region,sort_order,name);
drop trigger if exists world_locations_set_updated_at on public.world_locations;
create trigger world_locations_set_updated_at before update on public.world_locations for each row execute function public.set_updated_at();
alter table public.world_locations enable row level security;
create policy "world_locations_read_published" on public.world_locations for select to authenticated using(status='published');
revoke all on public.world_locations from anon;
grant select on public.world_locations to authenticated;
insert into public.world_locations(id,slug,name,region,biome,summary,description,danger_level,recommended_level,status,sort_order) values
('10000000-0000-4000-8000-000000000001','silberhain','Silberhain','Königreich Avelorn','Uralter Wald','Ein leuchtender Wald, dessen Pfade sich mit dem Mond verändern.','Zwischen silbernen Stämmen bewahren Waldhüter die Grenzen zu vergessenen Feenpfaden. Reisende berichten von Stimmen im Nebel und Ruinen, die nur bei Vollmond sichtbar werden.',2,1,'published',10),
('10000000-0000-4000-8000-000000000002','kronenwacht','Kronenwacht','Königreich Avelorn','Festungsstadt','Die befestigte Hauptstadt am Kreuzweg der alten Handelsstraßen.','Hohe Mauern, belebte Märkte und der Sitz des königlichen Rates prägen Kronenwacht. Unter den gepflasterten Straßen liegen ältere Gewölbe, deren Zugänge streng bewacht werden.',1,1,'published',20),
('10000000-0000-4000-8000-000000000003','aschgrat','Aschgrat','Die Grenzmarken','Vulkanisches Gebirge','Schwarze Gipfel über verlassenen Minen und glühenden Schluchten.','Der Aschgrat trennt die bewohnten Reiche vom verwüsteten Osten. In seinen Stollen suchen Bergleute nach Sternenerz, während uralte Kreaturen in der Tiefe erwachen.',4,5,'published',30),
('10000000-0000-4000-8000-000000000004','nebelmoor','Nebelmoor','Die Grenzmarken','Moorland','Ein endloses Moor, in dem Irrlichter sichere Wege und tödliche Fallen zugleich markieren.','Versunkene Steinkreise ragen aus schwarzem Wasser. Nur ortskundige Führer kennen die Dämme, die nicht bei jedem Sonnenuntergang ihre Richtung ändern.',3,3,'published',40),
('10000000-0000-4000-8000-000000000005','sternfall-kueste','Sternfall-Küste','Freie Küsten','Felsenküste','Windgepeitschte Klippen, Freihäfen und die Splitter eines gefallenen Sterns.','Zwischen Schmugglerbuchten und Leuchttürmen handeln Seefahrer mit Waren aus fernen Reichen. Bei Ebbe führen schimmernde Pfade zu Höhlen unter den Klippen.',2,2,'published',50),
('10000000-0000-4000-8000-000000000006','die-hohle-krone','Die Hohle Krone','Verlorene Lande','Verfluchte Ruinen','Die Ruinen einer Metropole, deren letzter König nie ein Grab erhielt.','Zerbrochene Türme umgeben einen leeren Palast. Die Straßen wirken verlassen, doch in jeder Nacht brennen hinter blinden Fenstern neue Lichter.',5,8,'published',60)
on conflict(id) do update set slug=excluded.slug,name=excluded.name,region=excluded.region,biome=excluded.biome,summary=excluded.summary,description=excluded.description,danger_level=excluded.danger_level,recommended_level=excluded.recommended_level,status=excluded.status,sort_order=excluded.sort_order;
notify pgrst,'reload schema';
commit;
