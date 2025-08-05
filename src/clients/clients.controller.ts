import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { Prisma } from '@prisma/client';

@Controller('clients')
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  create(@Body() data: Prisma.ClientCreateInput) {
    return this.clientsService.createClient(data);
  }

  @Get()
  findClients(@Query('name') name?: string) {
    return this.clientsService.findClients(name);
  }

  @Get(':id')
  getClientById(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getClientById(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Prisma.ClientUpdateInput,
  ) {
    return this.clientsService.updateClient(id, data);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.deleteClient(id);
  }
}
