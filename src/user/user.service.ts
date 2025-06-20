import { Injectable } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

@Injectable()
export class UserService {
  async create(data: { name: string; username: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return prisma.user.create({
      data: {
        name: data.name,
        username: data.username,
        password: hashedPassword,
        role: Role.USER,
      },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username: username } });
  }
}
