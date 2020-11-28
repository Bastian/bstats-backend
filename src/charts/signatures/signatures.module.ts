import { forwardRef, Module } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { SignaturesController } from './signatures.controller';
import { ChartRendererModule } from '../chart-renderer/chart-renderer.module';
import { SoftwareModule } from '../../software/software.module';
import { ChartsModule } from '../charts.module';
import { ServicesModule } from '../../services/services.module';

@Module({
  providers: [SignaturesService],
  controllers: [SignaturesController],
  imports: [
    ChartRendererModule,
    SoftwareModule,
    forwardRef(() => ChartsModule),
    forwardRef(() => ServicesModule),
  ],
})
export class SignaturesModule {}
