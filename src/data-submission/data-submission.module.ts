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
import { BugeecordVersionParser } from './parser/bugeecord-version.parser';
import { PredefinedValueParser } from './parser/predefined-value.parser';
import { NameInRequestParser } from './parser/name-in-request.parser';
import { RatelimitService } from './ratelimit.service';

@Module({
  providers: [
    DataSubmissionService,
    RatelimitService,
    OsParser,
    JavaVersionParser,
    BukkitMinecraftVersionParser,
    BukkitServerSoftwareParser,
    BugeecordVersionParser,
    PredefinedValueParser,
    NameInRequestParser,
  ],
  controllers: [DataSubmissionController],
  imports: [SoftwareModule, ServicesModule, ChartsModule],
})
export class DataSubmissionModule {}
