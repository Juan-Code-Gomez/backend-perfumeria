import { ValidationPipe } from '@nestjs/common';

export function createValidationPipe() {
  return new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    disableErrorMessages: false,
    validationError: {
      target: false,
      value: false,
    },
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        const constraints = Object.values(error.constraints || {});
        return `${error.property}: ${constraints.join(', ')}`;
      });
      
      return new Error(`Errores de validación: ${messages.join('; ')}`);
    },
  });
}
