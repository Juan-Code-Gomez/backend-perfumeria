import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private userService: UserService) {}

  async register(dto: RegisterDto) {
    const exists = await this.userService.findByUsername(dto.username);
    if (exists) throw new UnauthorizedException('Usuario ya registrado');

    // Pasa roleIds al create
    const user = await this.userService.create({
      name: dto.name,
      username: dto.username,
      password: dto.password,
      roleIds: dto.roleIds,
    });

    // Extrae solo nombres de rol para el token
    const roles = user.roles.map((ur) => ur.role.name);

    const token = this.jwt.sign({ id: user.id, roles });
    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByUsername(dto.username);
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Si se proporciona companyCode, validar que coincida
    if (dto.companyCode && user.companyCode && user.companyCode !== dto.companyCode.toUpperCase()) {
      throw new UnauthorizedException('Código de empresa no válido para este usuario');
    }

    const roles = user.roles.map((ur) => ur.role.name);
    const token = this.jwt.sign({ id: user.id, roles });
    return { user, token };
  }
}
