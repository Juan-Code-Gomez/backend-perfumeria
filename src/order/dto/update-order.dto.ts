import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderDetailDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDetailDto)
  details?: CreateOrderDetailDto[];
}
