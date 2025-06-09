import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private jwt: JwtService, private userService: UserService) {}

  async register(data: any) {
    const userExists = await this.userService.findByEmail(data.email);
    if (userExists) throw new UnauthorizedException('Email ya registrado');
    const user = await this.userService.create(data);
    const token = this.jwt.sign({ id: user.id, role: user.role });
    return { user, token };
  }

  async login(data: any) {
    const user = await this.userService.findByEmail(data.email);
    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const token = this.jwt.sign({ id: user.id, role: user.role });
    return { user, token };
  }
}
