import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';

export interface PokemonDetails {
  pokeId: number;
  name: string;
  weight: number;
  sprite: string;
  types: string[];
}

@Injectable()
export class PokeapiService {
    private readonly logger = new Logger(PokeapiService.name);
    private readonly baseUrl = 'https://pokeapi.co/api/v2';

    constructor(private readonly httpService: HttpService) {}

    async getPokemonsByIds(ids: number[]): Promise<PokemonDetails[]> {          
      return Promise.all(ids.map((id) => this.fetchOne(id)));
    }    

    private async fetchOne(id: number): Promise<PokemonDetails> {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get(`${this.baseUrl}/pokemon/${id}`),
            );
            return {
                pokeId: data.id,
                name: data.name,
                weight: data.weight,
                sprite: data.sprites?.front_default ?? '',
                types: data.types.map((t: { type: { name: string } }) => t.type.name),
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'unknown';
            this.logger.warn(`Failed to fetch pokemon ${id}: ${msg}`);
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw new BadRequestException(`Pokemon with id ${id} does not exist`);
            }
            throw new BadRequestException(`Failed to fetch pokemon with id ${id}. Try
        again later.`);
        }
    }
}
