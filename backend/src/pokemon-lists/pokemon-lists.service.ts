import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePokemonListDto } from './dto/create-pokemon-list.dto';
import {
  PokemonList,
  PokemonListDocument,
} from './schemas/pokemon-list.schema';
import { PokeapiService } from 'src/pokeapi/pokeapi.service';

@Injectable()
export class PokemonListsService {
  private static readonly MIN_DIFFERENT_SPECIES = 3;
  private static readonly MAX_TOTAL_WEIGHT = 1300;

  constructor(
    @InjectModel(PokemonList.name)
    private readonly listModel: Model<PokemonListDocument>,
    private readonly pokeapi: PokeapiService,
  ) {}

  async create(dto: CreatePokemonListDto): Promise<PokemonListDocument> {
    const uniqueIds = Array.from(new Set(dto.pokemons.map((p) => p.pokeId)));

    if (uniqueIds.length < PokemonListsService.MIN_DIFFERENT_SPECIES) {
      throw new BadRequestException(
        `At least ${PokemonListsService.MIN_DIFFERENT_SPECIES} different Pokemon species are required (received ${uniqueIds.length} unique).`,         
      );
    }

    const pokemons = await this.pokeapi.getPokemonsByIds(uniqueIds);

    const totalWeight = pokemons.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight > PokemonListsService.MAX_TOTAL_WEIGHT) {
      throw new BadRequestException(
        `Total weight exceeds the maximum allowed (${PokemonListsService.MAX_TOTAL_WEIGHT}) hg.`,
      );
    }
    return this.listModel.create({ name: dto.name, pokemons });
  }

  findAll(): Promise<PokemonListDocument[]> {
    return this.listModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<PokemonListDocument> {
    const list = await this.listModel.findById(id).exec();
    if (!list) {
      throw new NotFoundException(`List with id ${id} not found`);
    }
    return list;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const result = await this.listModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`List with id ${id} not found`);
    }
    return { deleted: true };
  }

  async exportToFile(id: string): Promise<{ filename: string; payload: string }> {
    const list = await this.findOne(id);

    const safeName = list.name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const filename = `${safeName || 'pokemon-list'}-${list._id}.json`;

    const exportPayload = {
      name: list.name,
      exportedAt: new Date().toISOString(),
      pokemons: list.pokemons.map((p) => ({
        pokeId: p.pokeId,
        name: p.name,
        weight: p.weight,
      })),
    };
    return {
      filename,
      payload: JSON.stringify(exportPayload, null, 2),
    };
  }
}
