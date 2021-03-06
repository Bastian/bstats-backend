import { Module } from '@nestjs/common';
import { DataSubmissionService } from './data-submission.service';
import { DataSubmissionController } from './data-submission.controller';
import { SoftwareModule } from '../software/software.module';
import { ServicesModule } from '../services/services.module';
import { ChartsModule } from '../charts/charts.module';
import { OsParser } from './parser/os.parser';
import { JavaVersionParser } from './parser/java-version.parser';
import { BukkitMinecraftVersionParser } from './parser/bukkit-minecraft-version.parser';
import { BukkitServerSoftwareParser } from './parser/bukkit-server-software.parser';
import { BungeecordVersionParser } from './parser/bungeecord-version.parser';
import { PredefinedValueParser } from './parser/predefined-value.parser';
import { NameInRequestParser } from './parser/name-in-request.parser';
import { RatelimitService } from './ratelimit.service';
import { ParserService } from './parser.service';
import { GeoIpService } from './geo-ip.service';
import { SimplePieChartDataProcessor } from './data-processors/simple-pie-chart-data.processor';
import { AdvancedPieChartDataProcessor } from './data-processors/advanced-pie-chart-data.processor';
import { DrilldownPieChartDataProcessor } from './data-processors/drilldown-pie-chart-data.processor';
import { SingleLineChartDataProcessor } from './data-processors/single-line-chart-data.processor';
import { SimpleMapChartDataProcessor } from './data-processors/simple-map-chart-data.processor';
import { ChartDataProcessorService } from './chart-data-processor.service';
import { BarChartDataProcessor } from './data-processors/bar-chart-data.processor';
import { ConfigModule } from '@nestjs/config';

@Module({
  providers: [
    DataSubmissionService,
    RatelimitService,
    ParserService,
    GeoIpService,
    OsParser,
    JavaVersionParser,
    BukkitMinecraftVersionParser,
    BukkitServerSoftwareParser,
    BungeecordVersionParser,
    PredefinedValueParser,
    NameInRequestParser,
    ChartDataProcessorService,
    SimplePieChartDataProcessor,
    AdvancedPieChartDataProcessor,
    DrilldownPieChartDataProcessor,
    SingleLineChartDataProcessor,
    SimpleMapChartDataProcessor,
    BarChartDataProcessor,
  ],
  controllers: [DataSubmissionController],
  imports: [ConfigModule, SoftwareModule, ServicesModule, ChartsModule],
  exports: [DataSubmissionService],
})
export class DataSubmissionModule {}
