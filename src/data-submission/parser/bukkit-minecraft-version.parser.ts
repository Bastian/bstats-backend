import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

@Injectable()
export class BukkitMinecraftVersionParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    submitDataPluginDto: SubmitDataPluginDto | null,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    const { bukkitVersion } = submitDataDto;

    if (typeof bukkitVersion !== 'string') {
      return null;
    }

    let version = bukkitVersion;
    // If it does contain "MC: ", it's from an new bStats Metrics class
    if (bukkitVersion.indexOf('MC:') !== -1) {
      const parsed = /.+\(MC: ([\d\\.]+)\)/gm.exec(bukkitVersion);
      version = parsed != null ? parsed[1] : 'Failed to parse';
    }

    return [
      new SubmitDataCustomChartDto(
        chart.idCustom,
        { value: version },
        requestRandom,
      ),
    ];
  }
}
