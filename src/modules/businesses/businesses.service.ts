import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateBusinessDto) {
    const existingBusiness = await this.prisma.business.findUnique({
      where: { ownerId },
    });

    if (existingBusiness) {
      throw new ForbiddenException('You already have a registered business');
    }

    return this.prisma.business.create({
      data: {
        ownerId,
        ...dto,
      },
      include: { owner: true },
    });
  }

  async findMyBusiness(ownerId: string) {
    const business = await this.prisma.business.findUnique({
      where: { ownerId },
      include: { services: true },
    });

    if (!business) throw new NotFoundException('Business not found');
    return business;
  }

  async findAll(query: any = {}) {
    // Add location-based filtering later
    return this.prisma.business.findMany({
      where: { isVerified: true },
      include: {
        services: true,
        owner: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async update(ownerId: string, dto: UpdateBusinessDto) {
    return this.prisma.business.update({
      where: { ownerId },
      data: dto,
    });
  }
}
