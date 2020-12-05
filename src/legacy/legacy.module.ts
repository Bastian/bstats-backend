import { Module } from '@nestjs/common';
import { LegacyController } from './legacy.controller';
import { ServicesModule } from '../services/services.module';
import { ChartsModule } from '../charts/charts.module';

// This module contains legacy endpoints that should no longer be used but exist to
// maintain backwards-compatibility with users that rely on the old public api.
// The mapping looks like this and can be done with any reverse proxy:
// - /api/v1/plugins -> /services (no legacy)
// - /api/v1/plugins/:id -> /legacy/service/:id
// - /api/v1/plugins/:id/charts -> /legacy/service/:id/charts
// - /api/v1/plugins/:id/charts/:idCustom -> /legacy/service/:id/charts/:idCustom
// - /api/v1/plugins/:id/charts/:idCustom/data -> /legacy/service/:id/charts/:idCustom/data
@Module({
  controllers: [LegacyController],
  imports: [ServicesModule, ChartsModule],
})
export class LegacyModule {}
