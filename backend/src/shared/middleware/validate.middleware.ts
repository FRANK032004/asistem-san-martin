/**
 * Middleware de Validación con class-validator
 * Valida automáticamente los DTOs en las peticiones
 */

import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError as ClassValidatorError } from 'class-validator';
import { ValidationError } from '../utils/app-error';

/**
 * Middleware para validar DTOs automáticamente
 * 
 * @param dtoClass - Clase del DTO a validar
 * @param source - De dónde tomar los datos ('body', 'query', 'params')
 * @returns Middleware de Express
 * 
 * @example
 * ```typescript
 * router.post('/login', validateDTO(LoginDTO), authController.login);
 * ```
 */
export function validateDTO(
  dtoClass: any,
  source: 'body' | 'query' | 'params' = 'body'
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Transformar plain object a instancia de clase
      const dtoInstance = plainToClass(dtoClass, req[source]);

      // Validar con class-validator
      const errors: ClassValidatorError[] = await validate(dtoInstance, {
        whitelist: true, // Elimina propiedades no definidas en el DTO
        forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
        skipMissingProperties: false, // Valida todas las propiedades
        validationError: {
          target: false, // No incluir el objeto target en el error
          value: false // No incluir el valor en el error (seguridad)
        }
      });

      // Si hay errores, formatearlos y lanzar ValidationError
      if (errors.length > 0) {
        const formattedErrors = formatValidationErrors(errors);
        throw new ValidationError(formattedErrors);
      }

      // Reemplazar los datos originales con el DTO validado
      req[source] = dtoInstance;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Formatear errores de class-validator a un formato legible
 */
function formatValidationErrors(errors: ClassValidatorError[]): string {
  const messages: string[] = [];

  errors.forEach((error) => {
    if (error.constraints) {
      // Obtener todos los mensajes de error para esta propiedad
      const constraintMessages = Object.values(error.constraints);
      messages.push(...constraintMessages);
    }

    // Si hay errores anidados (para objetos nested)
    if (error.children && error.children.length > 0) {
      const childMessages = formatNestedErrors(error.children, error.property);
      messages.push(...childMessages);
    }
  });

  return messages.join(', ');
}

/**
 * Formatear errores anidados recursivamente
 */
function formatNestedErrors(
  errors: ClassValidatorError[],
  parentProperty: string
): string[] {
  const messages: string[] = [];

  errors.forEach((error) => {
    const propertyPath = `${parentProperty}.${error.property}`;

    if (error.constraints) {
      const constraintMessages = Object.values(error.constraints).map(
        (message) => `${propertyPath}: ${message}`
      );
      messages.push(...constraintMessages);
    }

    if (error.children && error.children.length > 0) {
      const childMessages = formatNestedErrors(error.children, propertyPath);
      messages.push(...childMessages);
    }
  });

  return messages;
}

/**
 * Middleware para validar múltiples DTOs
 * Útil para endpoints que aceptan datos de múltiples fuentes
 * 
 * @example
 * ```typescript
 * router.put(
 *   '/user/:id',
 *   validateMultipleDTOs([
 *     { dto: UpdateUserDTO, source: 'body' },
 *     { dto: UserIdDTO, source: 'params' }
 *   ]),
 *   userController.update
 * );
 * ```
 */
export function validateMultipleDTOs(
  validations: Array<{ dto: any; source: 'body' | 'query' | 'params' }>
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      for (const validation of validations) {
        const dtoInstance = plainToClass(validation.dto, req[validation.source]);
        
        const errors: ClassValidatorError[] = await validate(dtoInstance, {
          whitelist: true,
          forbidNonWhitelisted: true,
          skipMissingProperties: false,
          validationError: {
            target: false,
            value: false
          }
        });

        if (errors.length > 0) {
          const formattedErrors = formatValidationErrors(errors);
          throw new ValidationError(formattedErrors);
        }

        req[validation.source] = dtoInstance;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
