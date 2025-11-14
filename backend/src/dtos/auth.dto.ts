/**
 * DTOs para Autenticación
 * Validaciones automáticas con class-validator
 */

import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';

/**
 * DTO para Login
 */
export class LoginDTO {
  @IsEmail({}, { message: 'Email debe ser válido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email!: string;

  @IsString({ message: 'Password debe ser un string' })
  @IsNotEmpty({ message: 'Password es requerido' })
  @MinLength(6, { message: 'Password debe tener al menos 6 caracteres' })
  password!: string;
}

/**
 * DTO para Registro de Usuario
 */
export class RegisterDTO {
  @IsEmail({}, { message: 'Email debe ser válido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email!: string;

  @IsString({ message: 'Password debe ser un string' })
  @IsNotEmpty({ message: 'Password es requerido' })
  @MinLength(6, { message: 'Password debe tener al menos 6 caracteres' })
  @MaxLength(50, { message: 'Password no puede exceder 50 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
    { message: 'Password debe contener al menos una mayúscula, una minúscula y un número' }
  )
  password!: string;

  @IsString({ message: 'Nombres debe ser un string' })
  @IsNotEmpty({ message: 'Nombres son requeridos' })
  @MinLength(2, { message: 'Nombres debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Nombres no puede exceder 100 caracteres' })
  nombres!: string;

  @IsString({ message: 'Apellidos debe ser un string' })
  @IsNotEmpty({ message: 'Apellidos son requeridos' })
  @MinLength(2, { message: 'Apellidos debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Apellidos no puede exceder 100 caracteres' })
  apellidos!: string;

  @IsString({ message: 'Rol debe ser un string' })
  @IsNotEmpty({ message: 'Rol es requerido' })
  @Matches(/^(ADMIN|DOCENTE)$/, { message: 'Rol debe ser ADMIN o DOCENTE' })
  rol!: string;

  @IsString({ message: 'Teléfono debe ser un string' })
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Teléfono debe tener 9 dígitos' })
  telefono?: string;

  @IsString({ message: 'DNI debe ser un string' })
  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'DNI debe tener 8 dígitos' })
  dni?: string;
}

/**
 * DTO para actualizar perfil
 */
export class UpdateProfileDTO {
  @IsString({ message: 'Nombres debe ser un string' })
  @IsOptional()
  @MinLength(2, { message: 'Nombres debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Nombres no puede exceder 100 caracteres' })
  nombres?: string;

  @IsString({ message: 'Apellidos debe ser un string' })
  @IsOptional()
  @MinLength(2, { message: 'Apellidos debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'Apellidos no puede exceder 100 caracteres' })
  apellidos?: string;

  @IsString({ message: 'Teléfono debe ser un string' })
  @IsOptional()
  @Matches(/^\d{9}$/, { message: 'Teléfono debe tener 9 dígitos' })
  telefono?: string;

  @IsEmail({}, { message: 'Email debe ser válido' })
  @IsOptional()
  email?: string;
}

/**
 * DTO para cambio de contraseña
 */
export class ChangePasswordDTO {
  @IsString({ message: 'Password actual debe ser un string' })
  @IsNotEmpty({ message: 'Password actual es requerido' })
  currentPassword!: string;

  @IsString({ message: 'Nuevo password debe ser un string' })
  @IsNotEmpty({ message: 'Nuevo password es requerido' })
  @MinLength(6, { message: 'Nuevo password debe tener al menos 6 caracteres' })
  @MaxLength(50, { message: 'Nuevo password no puede exceder 50 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{6,}$/,
    { message: 'Nuevo password debe contener al menos una mayúscula, una minúscula y un número' }
  )
  newPassword!: string;
}
