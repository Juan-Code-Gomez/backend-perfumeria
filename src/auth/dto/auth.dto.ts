export class RegisterDto {
  name: string;
  username: string;
  password: string;
  roleIds?: number[]; // ← Nuevo campo opcional
}

export class LoginDto {
  username: string;
  password: string;
}