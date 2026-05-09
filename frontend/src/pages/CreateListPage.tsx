import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getCatalogPage,
  getPokemonIndex,
  getCatalogByEntries,
  type CatalogItem,
} from '../api/pokeapi';
import { pokemonListsApi } from '../api/pokemonLists';
import { extractErrorMessage } from '../api/errors';
import { getTypeColor } from '../utils/typeColor';
import { useDebounce } from '../utils/useDebounce';
import type { CreatePokemonListPayload } from '../types/pokemonList';

const PAGE_SIZE = 20;
const MIN_SPECIES = 3;
const MAX_WEIGHT = 1300;
const MAX_SEARCH_RESULTS = 30;

export function CreateListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search.trim().toLowerCase(), 300);
  const [selected, setSelected] = useState<Map<number, CatalogItem>>(new Map());
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSearching = debouncedSearch.length > 0;

  const { data: catalogPage, isLoading: catalogLoading, isError: catalogError, isFetching } = useQuery({
    queryKey: ['pokeapi-catalog', page],
    queryFn: () => getCatalogPage(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
    enabled: !isSearching,
  });

  const { data: index } = useQuery({
    queryKey: ['pokeapi-index'],
    queryFn: getPokemonIndex,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const matchedEntries = useMemo(() => {
    if (!isSearching || !index) return [];
    return index
      .filter((p) => p.name.includes(debouncedSearch))
      .slice(0, MAX_SEARCH_RESULTS);
  }, [index, debouncedSearch, isSearching]);

  const totalMatches = useMemo(() => {
    if (!isSearching || !index) return 0;
    return index.filter((p) => p.name.includes(debouncedSearch)).length;
  }, [index, debouncedSearch, isSearching]);

  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
  } = useQuery({
    queryKey: ['pokeapi-search', debouncedSearch],
    queryFn: () => getCatalogByEntries(matchedEntries),
    enabled: isSearching && matchedEntries.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: pokemonListsApi.create,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['pokemon-lists'] });
      navigate(`/lists/${created._id}`);
    },
  });

  const toggleSelection = (item: CatalogItem) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(item.pokeId)) next.delete(item.pokeId);
      else next.set(item.pokeId, item);
      return next;
    });
  };

  const { totalWeight, speciesCount, weightOk, speciesOk, nameOk } =
    useMemo(() => {
      const totalWeight = [...selected.values()].reduce(
        (sum, p) => sum + p.weight,
        0,
      );
      return {
        totalWeight,
        speciesCount: selected.size,
        weightOk: totalWeight <= MAX_WEIGHT,
        speciesOk: selected.size >= MIN_SPECIES,
        nameOk: name.trim().length > 0,
      };
    }, [selected, name]);

  const canSave = nameOk && weightOk && speciesOk && !createMutation.isPending;
  const totalPages = catalogPage ? Math.ceil(catalogPage.total / PAGE_SIZE) : 0;
  const weightPct = Math.min(100, (totalWeight / MAX_WEIGHT) * 100);

  const handleSave = () => {
    createMutation.mutate({
      name: name.trim(),
      pokemons: [...selected.values()].map((p) => ({ pokeId: p.pokeId })),
    });
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (
        typeof parsed?.name !== 'string' ||
        !Array.isArray(parsed?.pokemons)
      ) {
        throw new Error(
          'Invalid file format: expected an object with "name" and "pokemons" array.',
        );
      }

      const pokemons = parsed.pokemons.map((p: unknown, i: number) => {
        if (
          !p ||
          typeof p !== 'object' ||
          typeof (p as { pokeId?: unknown }).pokeId !== 'number'
        ) {
          throw new Error(`Entry ${i} is missing a numeric "pokeId".`);
        }
        return { pokeId: (p as { pokeId: number }).pokeId };
      });

      const payload: CreatePokemonListPayload = { name: parsed.name, pokemons };
      setFileError(null);
      createMutation.mutate(payload);
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to read file.');
    }
  };

  const visibleItems: CatalogItem[] = isSearching
    ? searchResults ?? []
    : catalogPage?.items ?? [];
  const showLoading = isSearching ? searchLoading : catalogLoading;
  const showError = isSearching ? searchError : catalogError;

  return (
    <div>
      <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent mb-6">
        Create new list
      </h1>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur p-6 mb-8 shadow-lg shadow-black/20">
        <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">
          List name
        </label>
        <input
          type="text"
          placeholder="e.g. Starter trio"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-slate-950/60 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none rounded-xl px-4 py-2.5 mb-5 text-white transition"
        />

        <SelectionSummary
          speciesCount={speciesCount}
          totalWeight={totalWeight}
          nameOk={nameOk}
          speciesOk={speciesOk}
          weightOk={weightOk}
          weightPct={weightPct}
        />

        <div className="flex flex-wrap gap-3 mt-5">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 disabled:shadow-none transition"
          >
            {createMutation.isPending ? 'Saving…' : '✓ Save list'}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={createMutation.isPending}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 text-slate-100 px-5 py-2.5 rounded-xl font-medium transition"
          >
            ↑ Upload from file
          </button>
        </div>

        {createMutation.isError && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-2 text-red-300 text-sm">
            {extractErrorMessage(createMutation.error)}
          </div>
        )}
        {fileError && (
          <div className="mt-4 rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-2 text-red-300 text-sm">
            {fileError}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">
          Catalog
          {isFetching && !isSearching && (
            <span className="ml-2 text-sm text-slate-400 font-normal">
              updating…
            </span>
          )}
        </h2>
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
            🔍
          </span>
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 outline-none rounded-xl pl-9 pr-9 py-2 text-white text-sm transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 text-sm"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {isSearching && (
        <p className="text-sm text-slate-400 mb-3">
          {totalMatches === 0
            ? `No matches for "${debouncedSearch}".`
            : totalMatches > MAX_SEARCH_RESULTS
              ? `Showing ${MAX_SEARCH_RESULTS} of ${totalMatches} matches. Refine your query for more.`
              : `Found ${totalMatches} match${totalMatches === 1 ? '' : 'es'}.`}
        </p>
      )}

      {showLoading && (
        <div className="flex items-center gap-3 text-slate-400">
          <span className="inline-block w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          {isSearching ? 'Searching…' : 'Loading catalog…'}
        </div>
      )}
      {showError && (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-red-300">
          Failed to load {isSearching ? 'search results' : 'catalog'}.
        </div>
      )}

      {!showLoading && !showError && (
        <>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
            {visibleItems.map((item) => (
              <PokemonCard
                key={item.pokeId}
                item={item}
                isSelected={selected.has(item.pokeId)}
                onToggle={() => toggleSelection(item)}
              />
            ))}
          </ul>

          {!isSearching && catalogPage && (
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}

interface SummaryProps {
  speciesCount: number;
  totalWeight: number;
  nameOk: boolean;
  speciesOk: boolean;
  weightOk: boolean;
  weightPct: number;
}

function SelectionSummary({
  speciesCount,
  totalWeight,
  nameOk,
  speciesOk,
  weightOk,
  weightPct,
}: SummaryProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
        <Indicator ok={nameOk} label="Name provided" />
        <Indicator
          ok={speciesOk}
          label={`Species ${speciesCount} / ${MIN_SPECIES} min`}
        />
        <Indicator
          ok={weightOk}
          danger
          label={`Weight ${totalWeight} / ${MAX_WEIGHT} hg`}
        />
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            weightOk ? 'bg-emerald-500' : 'bg-red-500'
          }`}
          style={{ width: `${weightPct}%` }}
        />
      </div>
    </div>
  );
}

function Indicator({
  ok,
  label,
  danger = false,
}: {
  ok: boolean;
  label: string;
  danger?: boolean;
}) {
  const color = ok
    ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10'
    : danger
      ? 'text-red-300 border-red-500/40 bg-red-500/10'
      : 'text-slate-400 border-slate-700 bg-slate-800/40';
  return (
    <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${color}`}>
      <span>{ok ? '✓' : danger ? '✗' : '○'}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}

interface CardProps {
  item: CatalogItem;
  isSelected: boolean;
  onToggle: () => void;
}

function PokemonCard({ item, isSelected, onToggle }: CardProps) {
  return (
    <li>
      <button
        onClick={onToggle}
        className={`w-full rounded-2xl p-3 transition border ${
          isSelected
            ? 'bg-gradient-to-br from-emerald-600/40 to-sky-600/30 border-emerald-400 shadow-lg shadow-emerald-500/20'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-600 hover:bg-slate-900'
        }`}
      >
        <div className="relative">
          <img
            src={item.sprite}
            alt={item.name}
            className="w-20 h-20 mx-auto drop-shadow"
          />
          {isSelected && (
            <span className="absolute top-0 right-0 w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-xs font-bold">
              ✓
            </span>
          )}
        </div>
        <p className="text-center font-medium capitalize mt-1">{item.name}</p>
        <p className="text-center text-xs text-slate-400 mb-2">
          {item.weight} hg
        </p>
        <div className="flex justify-center gap-1 flex-wrap">
          {item.types.map((t) => (
            <span
              key={t}
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${getTypeColor(t)}`}
            >
              {t}
            </span>
          ))}
        </div>
      </button>
    </li>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 px-4 py-2 rounded-xl transition"
      >
        ← Prev
      </button>
      <span className="text-slate-300 text-sm">
        Page <span className="font-semibold">{page + 1}</span> of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page + 1 >= totalPages}
        className="bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 px-4 py-2 rounded-xl transition"
      >
        Next →
      </button>
    </div>
  );
}
