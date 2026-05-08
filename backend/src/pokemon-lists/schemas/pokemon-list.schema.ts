import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ _id: false })
export class PokemonItem {
    @Prop({ required: true })
    pokeId: number;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    weight: number;

    @Prop()
    sprite: string;

    @Prop({ type: [String], default: [] })
    types: string[];
}

export const PokemonItemSchema = SchemaFactory.createForClass(PokemonItem);

@Schema({ timestamps: true })
export class PokemonList {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ type: [PokemonItemSchema], required: true, default: [] })
    pokemons: PokemonItem[];
}

export type PokemonListDocument = HydratedDocument<PokemonList>;
export const PokemonListSchema = SchemaFactory.createForClass(PokemonList);
