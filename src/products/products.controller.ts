import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import * as multer from 'multer';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { QueryProductDto } from './dto/query-product.dto';
import { CreateProductMovementDto } from './dto/create-product-movement.dto';
import { CreateProductDto, UpdateProductDto } from './dto/enhanced-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { MESSAGES } from '../common/constants';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('alerts/low-stock')
  findLowStock() {
    return this.productsService.findLowStock();
  }

  @Get('statistics')
  getStatistics() {
    return this.productsService.getStatistics();
  }

  @Get(':id/movements')
  findMovements(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findMovements(id);
  }

  @Post(':id/movements')
  createMovement(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: CreateProductMovementDto,
  ) {
    return this.productsService.createMovement(id, data);
  }

  // @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  @Post()
  create(@Body() data: any) {
    return this.productsService.create(data);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.productsService.update(id, data);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }

  @Post('bulk-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB (ajusta si quieres)
      fileFilter: (req, file, cb) => {
        console.log('🔍 FileFilter - Archivo recibido:', {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        });
        
        // Permitir archivos Excel y CSV
        const allowedTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'text/csv', // .csv
          'application/csv' // .csv alternativo
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          console.log('✅ FileFilter - Archivo aceptado');
          cb(null, true);
        } else {
          console.log('❌ FileFilter - Archivo rechazado:', file.mimetype);
          cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten archivos .xlsx, .xls, .csv`), false);
        }
      },
    }),
  )
  async bulkUploadProducts(
    @UploadedFile() file: Express.Multer.File,
    @Body('withSupplier') withSupplier?: string
  ) {
    try {
      console.log('🔍 BULK UPLOAD - Entrada del controlador:');
      console.log('- Timestamp:', new Date().toISOString());
      console.log('- Archivo recibido:', !!file);
      
      if (file) {
        console.log('  - Nombre:', file.originalname);
        console.log('  - Tipo MIME:', file.mimetype);
        console.log('  - Tamaño:', file.size, 'bytes');
        console.log('  - Buffer presente:', !!file.buffer);
      }
      
      console.log('- withSupplier (raw):', withSupplier);
      console.log('- Tipo de withSupplier:', typeof withSupplier);
      
      // Verificar si hay algún problema con el archivo
      if (!file) {
        console.error('❌ Error: No se recibió archivo');
        return {
          success: false,
          error: 'No se recibió archivo en la petición',
          timestamp: new Date().toISOString()
        };
      }

      if (!file.buffer || file.buffer.length === 0) {
        console.error('❌ Error: Archivo vacío o sin buffer');
        return {
          success: false,
          error: 'El archivo está vacío o no se pudo leer',
          timestamp: new Date().toISOString()
        };
      }

      const includeSupplier = withSupplier === 'true';
      console.log('- includeSupplier procesado:', includeSupplier);
      
      console.log('🚀 Llamando al servicio...');
      const result = await this.productsService.bulkUploadProducts(file, includeSupplier);
      
      console.log('✅ Controller - Resultado exitoso:', {
        success: result.success,
        productosCreados: result.productosCreados,
        productosActualizados: result.productosActualizados,
        erroresCount: result.errores?.length || 0
      });
      
      return result;
    } catch (error) {
      console.error('❌ Controller - Error en bulk upload:');
      console.error('- Mensaje:', error.message);
      console.error('- Stack:', error.stack);
      console.error('- Tipo:', error.constructor.name);
      
      // Re-lanzar el error para que sea manejado por el filtro global
      throw error;
    }
  }

  @Get('bulk-upload/info')
  async getBulkUploadInfo() {
    return this.productsService.getBulkUploadInfo();
  }

  @Post('debug-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async debugUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any
  ) {
    try {
      console.log('🐛 DEBUG UPLOAD - Información recibida:');
      console.log('- Archivo:', file ? {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      } : 'NO ARCHIVO');
      console.log('- Body:', body);
      console.log('- withSupplier:', body?.withSupplier);
      
      if (!file) {
        return {
          success: false,
          error: 'No se recibió archivo',
          debug: { body }
        };
      }

      return {
        success: true,
        message: 'Archivo recibido correctamente',
        debug: {
          archivo: {
            nombre: file.originalname,
            tipo: file.mimetype,
            tamaño: file.size
          },
          body,
          withSupplier: body?.withSupplier
        }
      };
    } catch (error) {
      console.error('🐛 Error en debug upload:', error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  }

  @Get('export/excel')
  @Roles('ADMIN')
  async exportProducts(@Res() res: Response) {
    const result = await this.productsService.exportProducts();
    
    if (!result.success || !result.data) {
      return res.status(500).json(result);
    }

    // Configurar headers para descarga de archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
    res.setHeader('Content-Length', result.data.buffer.length);

    // Enviar el buffer del archivo
    res.send(result.data.buffer);
  }
}
