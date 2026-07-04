import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private authService: AuthService) {}

  // Public endpoint
  @Get('ping')
  ping() {
    return {
      success: true,
      message: 'Auth API is reachable',
    };
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    // @Body('business') businessDto?: RegisterBusinessDto,
  ) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.phone, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Req() req) {
    return req.user;
  }
}
