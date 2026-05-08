import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    ArrayMaxSize,
    IsArray,
    IsInt,
    IsNotEmpty,
    IsString,
    MaxLength,
    Min,
    ValidateNested,
} from 'class-validator';

export class PokemonSelectionDto {
    @IsInt()
    @Min(1)
    pokeId: number;
}

export class CreatePokemonListDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    name: string;

    @IsArray()
    @ArrayMinSize(3)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => PokemonSelectionDto)
    pokemons: PokemonSelectionDto[];
}
