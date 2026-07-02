import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { NombaService } from '../../integrations/nomba/nomba.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterBusinessDto } from './dto/register-business.dto';
import * as bcrypt from 'bcryptjs';
import { UserRole, BusinessCategory } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private nombaService: NombaService,
  ) {}

  //   businessDto?: RegisterBusinessDto

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser)
      throw new ConflictException('Phone number already registered');

    if (
      dto.role === UserRole.MERCHANT &&
      (!dto.name || !dto.address || !dto.category)
    ) {
      throw new BadRequestException(
        'Business details are required for merchants',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const accountRef = `doro_${dto.role.toLowerCase()}_${dto.phone}_`; // Unique reference for Nomba sub-account
    // Create Nomba Sub-Account
    const subAccount = await this.nombaService.post('/accounts/sub-accounts', {
      accountName: `${dto.firstName} ${dto.lastName}`,
      accountRef: accountRef,
    });

    const user = await this.prisma.user.create({
      data: {
        role: dto.role,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        password: hashedPassword,
        nombaSubAccountId: accountRef, // Adjust based on response
        // nombaSubAccountId: subAccount.data?.id || subAccount.id, // Adjust based on response
      },
    });

    // If Merchant, create Business
    if (dto.role === UserRole.MERCHANT) {
      await this.prisma.business.create({
        data: {
          ownerId: user.id,
          name: dto.name || '',
          category: dto.category || BusinessCategory.LAUNDRY,
          address: dto.address || '',
          location: dto.location || { lat: 0, lng: 0 },
        //   description: dto.description || '',
        },
      });
    }

    return this.loginUser(user);
  }

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }
    return this.loginUser(user);
  }

  private async loginUser(user: any) {
    const payload = { sub: user.id, role: user.role, phone: user.phone };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        role: user.role,
        firstName: user.firstName,
        phone: user.phone,
      },
    };
  }
}
