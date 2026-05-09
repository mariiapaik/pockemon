import axios from 'axios';

export interface CatalogItem {
  pokeId: number;
  name: string;
  weight: number;
  sprite: string;
  types: string[];
}

export interface IndexEntry {
  name: string;
  url: string;
}

interface ListResponse {
  count: number;
  results: IndexEntry[];
}

interface PokemonResponse {
  id: number;
  name: string;
  weight: number;
  sprites: { front_default: string | null };
  types: Array<{ type: { name: string } }>;
}

const POKEAPI = 'https://pokeapi.co/api/v2';

function normalize(data: PokemonResponse): CatalogItem {
  return {
    pokeId: data.id,
    name: data.name,
    weight: data.weight,
    sprite: data.sprites.front_default ?? '',
    types: data.types.map((t) => t.type.name),
  };
}

export async function getCatalogPage(
  page: number,
  pageSize = 20,
): Promise<{ items: CatalogItem[]; total: number }> {
  const offset = page * pageSize;

  const { data: list } = await axios.get<ListResponse>(`${POKEAPI}/pokemon`, {
    params: { offset, limit: pageSize },
  });

  const details = await Promise.all(
    list.results.map((r) => axios.get<PokemonResponse>(r.url)),
  );

  return {
    items: details.map(({ data }) => normalize(data)),
    total: list.count,
  };
}

export async function getPokemonIndex(): Promise<IndexEntry[]> {
  const { data } = await axios.get<ListResponse>(`${POKEAPI}/pokemon`, {
    params: { limit: 2000 },
  });
  return data.results;
}

export async function getCatalogByEntries(
  entries: IndexEntry[],
): Promise<CatalogItem[]> {
  const details = await Promise.all(
    entries.map((e) => axios.get<PokemonResponse>(e.url)),
  );
  return details.map(({ data }) => normalize(data));
}
