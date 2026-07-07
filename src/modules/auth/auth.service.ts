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
import { empty } from 'rxjs';
import { VirtualAccountsService } from '../virtual-accounts/virtual-accounts.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private nombaService: NombaService,
    private virtualAccountsService: VirtualAccountsService,
  ) {}

  //   businessDto?: RegisterBusinessDto

  async register(dto: RegisterDto) {
    // const existingUser = await this.prisma.user.findUnique({
    //   where: { phone: dto.phone },
    // });

    // if (existingUser)
    //   throw new ConflictException('Phone number already registered');

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ phone: dto.phone }, { email: dto.email }],
      },
    });

    if (existingUser) {
      if (existingUser.phone === dto.phone) {
        throw new ConflictException('Phone number already registered');
      }

      if (existingUser.email === dto.email) {
        throw new ConflictException('Email already registered');
      }
    }

    if (
      dto.role === UserRole.MERCHANT &&
      (!dto.name || !dto.address || !dto.category)
    ) {
      throw new BadRequestException(
        'Business details are required for merchants',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const accountRef = `doro_${dto.role.toLowerCase()}_${dto.phone.replace('+', '')}_${Date.now()}`;

    // const va = await this.nombaService.post('/accounts/virtual', {
    //   accountRef,
    //   accountName: `${dto.firstName} ${dto.lastName}`,
    //   expiryDate: '',
    //   //   expiryDate: '2026-12-31',
    //   //   amount: 1000000, // ₦10,000.00 — optional, locks expected amount
    // });
    // console.log('Virtual Account Response:', va);

    // Create Nomba Virtual Account
    let virtualAccountData: any;
    try {
      const vaResponse: any = await this.nombaService.post(
        '/accounts/virtual',
        {
          accountRef,
          accountName: `${dto.firstName} ${dto.lastName}`,
          // expiryDate: '2026-12-31',     // Uncomment if needed
          // amount: 1000000,              // Optional lock amount
        },
      );

      virtualAccountData = vaResponse.data || vaResponse;
      console.log('Virtual Account Response:', virtualAccountData);
    } catch (error) {
      console.error('Failed to create Nomba Virtual Account:', error);
      // Decide: fail registration or continue? (Fail is safer for now)
      throw new BadRequestException(
        'Failed to create payment account. Please try again.',
      );
    }

    // Create user in the database
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

    // Create Virtual Account Record
    await this.virtualAccountsService.createForUser(
      user.id,
      virtualAccountData,
    );
    // await this.prisma.virtualAccount.create({
    //   data: {
    //     userId: user.id,
    //     nombaAccountRef: virtualAccountData.accountRef || accountRef,
    //     bankAccountNumber: virtualAccountData.bankAccountNumber,
    //     bankAccountName: virtualAccountData.bankAccountName,
    //     bankName: virtualAccountData.bankName,
    //     accountHolderId: virtualAccountData.accountHolderId,
    //     accountName: virtualAccountData.accountName,
    //     currency: virtualAccountData.currency || 'NGN',
    //     bvn: virtualAccountData.bvn,
    //     expired: virtualAccountData.expired || false,
    //   },
    // });

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
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
      },
    };
  }
}
