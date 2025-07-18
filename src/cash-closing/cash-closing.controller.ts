import { Controller, Post, Body, Req, Get, Param, UseGuards } from '@nestjs/common';
import { CashClosingService } from './cash-closing.service';
import { CreateCashClosingDto } from './dto/create-cash-closing.dto';
// Si usas autenticación, puedes usar JwtAuthGuard aquí
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cash-closing')
// @UseGuards(JwtAuthGuard)
export class CashClosingController {
  constructor(private readonly cashClosingService: CashClosingService) {}

  @Post()
  async create(@Body() dto: CreateCashClosingDto, @Req() req: any) {
    // const userId = req.user?.userId;
    // Por ahora, si no tienes auth, pásalo como null
    return this.cashClosingService.create(dto /*, userId*/);
  }

  @Get()
  findAll() {
    return this.cashClosingService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cashClosingService.findOne(Number(id));
  }
}
