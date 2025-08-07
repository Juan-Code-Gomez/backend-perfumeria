import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';
    let error = 'Internal Server Error';

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || responseObj.error || message;
        error = responseObj.error || error;
      }
    }
    // Handle Prisma exceptions
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      
      switch (exception.code) {
        case 'P2002':
          message = 'Ya existe un registro con esos datos únicos';
          error = 'Duplicate Entry';
          break;
        case 'P2025':
          message = 'Registro no encontrado';
          error = 'Record Not Found';
          status = HttpStatus.NOT_FOUND;
          break;
        case 'P2003':
          message = 'Violación de restricción de clave foránea';
          error = 'Foreign Key Constraint';
          break;
        case 'P2014':
          message = 'Los datos proporcionados son inválidos';
          error = 'Invalid Data';
          break;
        default:
          message = 'Error en la base de datos';
          error = 'Database Error';
      }
    }
    // Handle Prisma validation errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Datos de entrada inválidos';
      error = 'Validation Error';
    }
    // Handle other errors
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Response format
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    response.status(status).json(errorResponse);
  }
}
