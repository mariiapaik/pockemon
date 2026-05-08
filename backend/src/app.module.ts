import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PokemonListsModule } from './pokemon-lists/pokemon-lists.module';
import { PokeapiModule } from './pokeapi/pokeapi.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    PokemonListsModule,
    PokeapiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
