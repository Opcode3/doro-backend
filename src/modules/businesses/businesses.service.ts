import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { BusinessQueryDto } from './dto/business-query.dto';

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

  async searchNearby(query: BusinessQueryDto) {
    const { lat, lng, radiusKm = 10, category, search } = query;

    // Fallback: No location provided
    if (!lat || !lng) {
      return this.prisma.business.findMany({
        where: {
          isVerified: true,
          ...(category && { category: category as any }), // Safe cast for now
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { address: { contains: search, mode: 'insensitive' } },
            ],
          }),
        },
        include: {
          services: true,
          reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Location-based search
    const radiusInMeters = radiusKm * 1000;

    const businesses = await this.prisma.$queryRaw`
      SELECT 
        b.*,
        (
          6371000 * acos(
            cos(radians(${lat})) * cos(radians((b.location->>'lat')::float)) *
            cos(radians((b.location->>'lng')::float) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians((b.location->>'lat')::float))
          )
        ) AS distance
      FROM "businesses" b
      WHERE b."isVerified" = true
        ${category ? Prisma.sql`AND b.category = ${category}` : Prisma.empty}
        ${search ? Prisma.sql`AND (b.name ILIKE ${'%' + search + '%'} OR b.address ILIKE ${'%' + search + '%'})` : Prisma.empty}
        AND (
          6371000 * acos(
            cos(radians(${lat})) * cos(radians((b.location->>'lat')::float)) *
            cos(radians((b.location->>'lng')::float) - radians(${lng})) +
            sin(radians(${lat})) * sin(radians((b.location->>'lat')::float))
          )
        ) <= ${radiusInMeters}
      ORDER BY distance ASC
      LIMIT 50;
    `;

    return businesses;
  }

  async update(ownerId: string, dto: UpdateBusinessDto) {
    return this.prisma.business.update({
      where: { ownerId },
      data: dto,
    });
  }
}
