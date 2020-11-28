import { Module } from '@nestjs/common';
import { ChartRendererService } from './chart-renderer.service';

@Module({
  providers: [ChartRendererService],
  exports: [ChartRendererService],
})
export class ChartRendererModule {}
