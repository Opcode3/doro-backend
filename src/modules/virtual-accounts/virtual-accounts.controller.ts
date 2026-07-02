import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { VirtualAccountsService } from './virtual-accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller({ path: 'virtual-accounts', version: '1' })
export class VirtualAccountsController {
  constructor(private virtualAccountsService: VirtualAccountsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyVirtualAccount(@Req() req) {
    return this.virtualAccountsService.findByUserId(req.user.userId);
  }
}
