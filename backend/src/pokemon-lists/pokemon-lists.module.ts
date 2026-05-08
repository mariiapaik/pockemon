import { Module } from '@nestjs/common';
import { PokemonListsService } from './pokemon-lists.service';
import { PokemonListsController } from './pokemon-lists.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PokemonList, PokemonListSchema } from './schemas/pokemon-list.schema';
import { PokeapiModule } from '../pokeapi/pokeapi.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PokemonList.name, schema: PokemonListSchema },
    ]),
    PokeapiModule,
  ],
  controllers: [PokemonListsController],
  providers: [PokemonListsService],
})
export class PokemonListsModule {}
