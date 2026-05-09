import { Controller, Get, Post, Body, Param, Delete, Res } from '@nestjs/common';
import { PokemonListsService } from './pokemon-lists.service';
import { CreatePokemonListDto } from './dto/create-pokemon-list.dto';
import type { Response } from 'express';

@Controller('pokemon-lists')
export class PokemonListsController {
  constructor(private readonly pokemonListsService: PokemonListsService) {}

  @Post()
  create(@Body() createPokemonListDto: CreatePokemonListDto) {
    return this.pokemonListsService.create(createPokemonListDto);
  }

  @Get()
  findAll() {
    return this.pokemonListsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pokemonListsService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pokemonListsService.remove(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { filename, payload } = await this.pokemonListsService.exportToFile(id);

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    res.send(payload);
  }
}
