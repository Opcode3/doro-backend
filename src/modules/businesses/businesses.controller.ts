import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller({ path: 'businesses', version: '1' })
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Post()
  create(@Req() req, @Body() dto: CreateBusinessDto) {
    return this.businessesService.create(req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Get('me')
  findMyBusiness(@Req() req) {
    return this.businessesService.findMyBusiness(req.user.userId);
  }

  @Get()
  findAll() {
    return this.businessesService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Patch('me')
  update(@Req() req, @Body() dto: UpdateBusinessDto) {
    return this.businessesService.update(req.user.userId, dto);
  }
}
