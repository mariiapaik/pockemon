export interface PokemonItem {
    pokeId: number;
    name: string;
    weight: number;
    sprite: string;
    types: string[];
}

export interface PokemonList {
    _id: string;
    name: string;
    pokemons: PokemonItem[];
    createdAt: string;
    updatedAt: string;
}

export interface CreatePokemonListPayload {
    name: string;
    pokemons: { pokeId: number }[];
}