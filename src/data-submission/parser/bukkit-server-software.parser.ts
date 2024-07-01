import { Injectable, Logger } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

const serverSoftwareBrands = new Map<string, string>();
serverSoftwareBrands.set('bukkit', 'Bukkit');
serverSoftwareBrands.set('taco', 'TacoSpigot');
serverSoftwareBrands.set('paper', 'Paper');
serverSoftwareBrands.set('folia', 'Folia');
serverSoftwareBrands.set('spigot', 'Spigot');
serverSoftwareBrands.set('catserver', 'CatServer');
serverSoftwareBrands.set('lava', 'Lava');
serverSoftwareBrands.set('mohist', 'Mohist');
serverSoftwareBrands.set('tuinity', 'Tuinity');
serverSoftwareBrands.set('purpur', 'Purpur');
serverSoftwareBrands.set('airplane', 'Airplane');
serverSoftwareBrands.set('yatopia', 'Yatopia');
serverSoftwareBrands.set('arclight', 'Arclight');
serverSoftwareBrands.set('magma', 'Magma');
serverSoftwareBrands.set('titanium', 'Titanium');
serverSoftwareBrands.set('scissors', 'Scissors');
serverSoftwareBrands.set('gale', 'Gale');
serverSoftwareBrands.set('glowstone', 'Glowstone');

@Injectable()
export class BukkitServerSoftwareParser implements Parser {
  private readonly logger = new Logger(BukkitServerSoftwareParser.name);

  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    const { bukkitVersion, bukkitName } = submitDataDto;

    if (typeof bukkitVersion !== 'string') {
      return null;
    }

    // If it doesn't contain "MC: ", it's from an old bStats Metrics class
    if (bukkitVersion.indexOf('MC:') === -1) {
      return null;
    }

    let softwareName = 'Unknown';

    // First try to find the software name based on the bukkit version
    const lowercaseBukkitVersion = bukkitVersion.toLowerCase();
    for (const [brand, name] of serverSoftwareBrands.entries()) {
      if (lowercaseBukkitVersion.indexOf(brand) !== -1) {
        softwareName = name;
        break;
      }
    }

    // then try to find the software name based on the bukkit name
    if (softwareName === 'Unknown' && typeof bukkitName === 'string') {
      const lowercaseBukkitName = bukkitName.toLowerCase();
      const maybeSoftwareName = serverSoftwareBrands.get(lowercaseBukkitName);
      if (maybeSoftwareName) {
        softwareName = maybeSoftwareName;
      }
    }

    // ultimately we log a message for further investigation
    if (softwareName === 'Unknown') {
      this.logger.log(
        'Unknown server software: bukkitVersion="' +
          bukkitVersion +
          '", bukkitName="' +
          bukkitName +
          '"',
      );
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
