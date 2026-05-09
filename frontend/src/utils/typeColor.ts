const typeColors: Record<string, string> = {
  fire: 'bg-orange-500/90 text-white',
  water: 'bg-sky-500/90 text-white',
  grass: 'bg-emerald-500/90 text-white',
  electric: 'bg-amber-400/90 text-slate-900',
  psychic: 'bg-pink-500/90 text-white',
  ice: 'bg-cyan-300/90 text-slate-900',
  dragon: 'bg-indigo-500/90 text-white',
  dark: 'bg-slate-700/90 text-white',
  fairy: 'bg-pink-300/90 text-slate-900',
  fighting: 'bg-red-600/90 text-white',
  flying: 'bg-sky-300/90 text-slate-900',
  poison: 'bg-fuchsia-600/90 text-white',
  ground: 'bg-amber-700/90 text-white',
  rock: 'bg-stone-500/90 text-white',
  bug: 'bg-lime-600/90 text-white',
  ghost: 'bg-violet-600/90 text-white',
  steel: 'bg-zinc-400/90 text-slate-900',
  normal: 'bg-stone-300/90 text-slate-900',
};

export function getTypeColor(type: string): string {
  return typeColors[type] ?? 'bg-slate-600/90 text-slate-100';
}
