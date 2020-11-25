import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/default-chart.interface';

@Injectable()
export class BukkitServerSoftwareParser implements Parser {
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

    // If it doesn't contain "MC: ", it's from an old bStats Metrics class
    if (bukkitVersion.indexOf('MC:') === -1) {
      return null;
    }

    const lowercaseBukkitVersion = bukkitVersion.toLowerCase();
    let softwareName = 'Unknown';

    // Maybe there's a good regex pattern, but sometimes the bukkitVersion looks pretty strange
    if (lowercaseBukkitVersion.indexOf('bukkit') !== -1) {
      softwareName = 'Bukkit';
    } else if (lowercaseBukkitVersion.indexOf('taco') !== -1) {
      softwareName = 'TacoSpigot';
    } else if (lowercaseBukkitVersion.indexOf('paper') !== -1) {
      softwareName = 'Paper';
    } else if (lowercaseBukkitVersion.indexOf('spigot') !== -1) {
      softwareName = 'Spigot';
    } else if (lowercaseBukkitVersion.indexOf('catserver') !== -1) {
      softwareName = 'CatServer';
    } else if (lowercaseBukkitVersion.indexOf('lava') !== -1) {
      softwareName = 'Lava';
    } else if (lowercaseBukkitVersion.indexOf('mohist') !== -1) {
      softwareName = 'Mohist';
    } else if (lowercaseBukkitVersion.indexOf('tuinity') !== -1) {
      softwareName = 'Tuinity';
    } else if (lowercaseBukkitVersion.indexOf('purpur') !== -1) {
      softwareName = 'Purpur';
    }

    return [
      new SubmitDataCustomChartDto(
        chart.idCustom,
        { value: softwareName },
        requestRandom,
      ),
    ];
  }
}
