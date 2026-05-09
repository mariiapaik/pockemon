import { api } from './client';
import type {
    PokemonList,
    CreatePokemonListPayload,
} from '../types/pokemonList';

export const pokemonListsApi = {
    getAll: async (): Promise<PokemonList[]> => {
        const { data } = await api.get<PokemonList[]>('./pokemon-lists');
        return data;
    },

    getOne: async (id: string): Promise<PokemonList> => {
        const { data } = await api.get<PokemonList>(`./pokemon-lists/${id}`);
        return data;
    },

    create: async (payload: CreatePokemonListPayload): Promise<PokemonList> => {
        const { data } = await api.post<PokemonList>('./pokemon-lists', payload);
        return data;
    },

    remove: async (id: string): Promise<void> => {
        await api.delete(`./pokemon-lists/${id}`);
    },

    getDownloadUrl: (id: string): string => `${import.meta.env.VITE_API_URL}/pokemon-lists/${id}/download`,
}