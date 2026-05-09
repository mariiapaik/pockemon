import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pokemonListsApi } from '../api/pokemonLists';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { PokemonList } from '../types/pokemonList';

export function MainPage() {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<PokemonList | null>(null);

  const {
    data: lists,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['pokemon-lists'],
    queryFn: pokemonListsApi.getAll,
  });

  const removeMutation = useMutation({
    mutationFn: pokemonListsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pokemon-lists'] });
    },
  });

  const handleConfirmDelete = () => {
    if (pendingDelete) removeMutation.mutate(pendingDelete._id);
    setPendingDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 text-slate-400">
        <span className="inline-block w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        Loading collections…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/60 bg-red-950/40 p-4 text-red-300">
        Failed to load collections: {(error as Error).message}
      </div>
    );
  }

  const count = lists?.length ?? 0;

  return (
    <div>
      <header className="mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent">
              Your Pokémon collections
            </h1>
            <p className="text-slate-400 mt-2">
              {count === 0
                ? 'No collections yet. Build your first one.'
                : `${count} collection${count === 1 ? '' : 's'} saved`}
            </p>
          </div>
          <Link
            to="/lists/new"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition"
          >
            + Create New List
          </Link>
        </div>
      </header>

      {lists && lists.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists?.map((list) => (
            <ListCard
              key={list._id}
              list={list}
              onRequestDelete={() => setPendingDelete(list)}
              isRemoving={
                removeMutation.isPending &&
                removeMutation.variables === list._id
              }
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this list?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed. This action can't be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed border-slate-700/70 bg-slate-900/40">
      <div className="text-6xl mb-4">🎒</div>
      <h2 className="text-xl font-semibold text-slate-200 mb-2">
        No collections yet
      </h2>
      <p className="text-slate-400 mb-6 max-w-md mx-auto">
        Pick three or more Pokémon, mind the 1300 hg weight limit, and save your first squad.
      </p>
      <Link
        to="/lists/new"
        className="inline-block bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-500/20 transition"
      >
        Create your first list →
      </Link>
    </div>
  );
}

interface ListCardProps {
  list: PokemonList;
  onRequestDelete: () => void;
  isRemoving: boolean;
}

function ListCard({ list, onRequestDelete, isRemoving }: ListCardProps) {
  const totalWeight = list.pokemons.reduce((sum, p) => sum + p.weight, 0);
  const createdAt = new Date(list.createdAt).toLocaleDateString();

  return (
    <li className="group relative rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur hover:border-emerald-500/40 hover:bg-slate-900 transition shadow-lg shadow-black/20">
      <Link to={`/lists/${list._id}`} className="block p-5">
        <h2 className="text-lg font-semibold mb-3 truncate group-hover:text-emerald-300 transition pr-10">
          {list.name}
        </h2>
        <div className="flex gap-1 mb-4 min-h-12">
          {list.pokemons.slice(0, 5).map((p) => (
            <img
              key={p.pokeId}
              src={p.sprite}
              alt={p.name}
              className="w-12 h-12 drop-shadow"
            />
          ))}
          {list.pokemons.length > 5 && (
            <div className="w-12 h-12 flex items-center justify-center text-xs text-slate-400 bg-slate-800/60 rounded-lg">
              +{list.pokemons.length - 5}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {list.pokemons.length} Pokémon · {totalWeight} hg
          </span>
          <span>{createdAt}</span>
        </div>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onRequestDelete();
        }}
        disabled={isRemoving}
        aria-label="Delete list"
        title="Delete list"
        className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 disabled:opacity-30 transition"
      >
        {isRemoving ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        )}
      </button>
    </li>
  );
}
