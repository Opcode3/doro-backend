import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Post('business/:businessId')
  create(
    @Req() req,
    @Param('businessId') businessId: string,
    @Body() dto: CreateServiceDto,
  ) {
    return this.servicesService.create(businessId, req.user.userId, dto);
  }

  @Get('business/:businessId')
  findByBusiness(@Param('businessId') businessId: string) {
    return this.servicesService.findByBusiness(businessId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Patch(':id')
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.servicesService.update(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.servicesService.remove(id, req.user.userId);
  }
}
