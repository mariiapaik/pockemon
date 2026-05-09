import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { pokemonListsApi } from '../api/pokemonLists';
import { extractErrorMessage } from '../api/errors';
import { getTypeColor } from '../utils/typeColor';

export function ViewListPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: list,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pokemon-lists', id],
    queryFn: () => pokemonListsApi.getOne(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <span className="inline-block w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        Loading list…
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <BackLink />
        <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-red-300">
          {extractErrorMessage(error)}
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div>
        <BackLink />
        <p className="text-slate-400 mt-4">List not found.</p>
      </div>
    );
  }

  const totalWeight = list.pokemons.reduce((sum, p) => sum + p.weight, 0);
  const createdAt = new Date(list.createdAt).toLocaleString();
  const downloadUrl = pokemonListsApi.getDownloadUrl(list._id);

  return (
    <div>
      <BackLink />

      <header className="mt-4 mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">
            {list.name}
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            <span className="font-semibold text-slate-200">
              {list.pokemons.length}
            </span>{' '}
            Pokémon ·{' '}
            <span className="font-semibold text-slate-200">{totalWeight}</span>{' '}
            hg · created {createdAt}
          </p>
        </div>
        <a
          href={downloadUrl}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition"
        >
          ⬇ Download
        </a>
      </header>

      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {list.pokemons.map((p) => (
          <li
            key={p.pokeId}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-4 hover:border-slate-700 transition shadow-lg shadow-black/20"
          >
            <img
              src={p.sprite}
              alt={p.name}
              className="w-24 h-24 mx-auto drop-shadow"
            />
            <h3 className="text-center font-semibold capitalize mt-2">
              {p.name}
            </h3>
            <p className="text-center text-xs text-slate-400 mb-3">
              {p.weight} hg
            </p>
            <div className="flex justify-center gap-1 flex-wrap">
              {p.types.map((t) => (
                <span
                  key={t}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide ${getTypeColor(t)}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-emerald-400 transition"
    >
      ← Back to all lists
    </Link>
  );
}
