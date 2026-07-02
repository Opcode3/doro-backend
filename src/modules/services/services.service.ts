import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async create(businessId: string, ownerId: string, dto: CreateServiceDto) {
    // Verify ownership
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) throw new NotFoundException('Business not found');
    if (business.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You can only manage services for your own business',
      );
    }

    return this.prisma.service.create({
      data: {
        businessId,
        ...dto,
      },
    });
  }

  async findByBusiness(businessId: string) {
    return this.prisma.service.findMany({
      where: { businessId, isActive: true },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, ownerId: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { business: true },
    });

    if (!service) throw new NotFoundException('Service not found');
    if (service.business.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.service.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string, ownerId: string) {
    // Soft delete by setting isActive = false
    const service = await this.findOne(id);
    if (service.business.ownerId !== ownerId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.service.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
