import { Module } from '@nestjs/common';
import { PokeapiService } from './pokeapi.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 3,
    }),
  ],
  providers: [PokeapiService],
  exports: [PokeapiService],
})
export class PokeapiModule {}
