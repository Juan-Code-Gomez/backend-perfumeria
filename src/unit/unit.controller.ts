import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { UnitService } from './unit.service';
import { CreateUnitDto, UpdateUnitDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitController {
  constructor(private readonly unitService: UnitService) {}

  @Post()
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitService.create(createUnitDto);
  }

  @Get()
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('search') search?: string,
    @Query('unitType') unitType?: string
  ) {
    const includeInactiveFlag = includeInactive === 'true';
    return this.unitService.findAll({ 
      includeInactive: includeInactiveFlag, 
      search,
      unitType 
    });
  }

  @Get('statistics')
  getStatistics() {
    return this.unitService.getStatistics();
  }

  @Get('by-type/:type')
  getUnitsByType(@Param('type') type: string) {
    return this.unitService.getUnitsByType(type);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unitService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitService.update(+id, updateUnitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unitService.remove(+id);
  }

  @Put(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.unitService.toggleStatus(+id);
  }
}
