import { Injectable } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

@Injectable()
export class BukkitServerSoftwareParser implements Parser {
  parse(
    chart: DefaultChart,
    submitDataDto: SubmitDataDto,
    requestRandom: number,
  ): SubmitDataCustomChartDto[] | null {
    const { bukkitName } = submitDataDto;

    if (typeof bukkitName !== 'string') {
      return null;
    }

    const lowercaseBukkitSoftware = bukkitName.toLowerCase();
    let softwareName = 'Unknown';

    // Maybe there's a good regex pattern, but sometimes the bukkitSoftware looks pretty strange
    if (lowercaseBukkitSoftware.indexOf('bukkit') !== -1) {
      softwareName = 'Bukkit';
    } else if (lowercaseBukkitSoftware.indexOf('taco') !== -1) {
      softwareName = 'TacoSpigot';
    } else if (lowercaseBukkitSoftware.indexOf('paper') !== -1) {
      softwareName = 'Paper';
    } else if (lowercaseBukkitSoftware.indexOf('folia') !== -1) {
      softwareName = 'Folia';
    } else if (lowercaseBukkitSoftware.indexOf('spigot') !== -1) {
      softwareName = 'Spigot';
    } else if (lowercaseBukkitSoftware.indexOf('catserver') !== -1) {
      softwareName = 'CatServer';
    } else if (lowercaseBukkitSoftware.indexOf('lava') !== -1) {
      softwareName = 'Lava';
    } else if (lowercaseBukkitSoftware.indexOf('mohist') !== -1) {
      softwareName = 'Mohist';
    } else if (lowercaseBukkitSoftware.indexOf('tuinity') !== -1) {
      softwareName = 'Tuinity';
    } else if (lowercaseBukkitSoftware.indexOf('purpur') !== -1) {
      softwareName = 'Purpur';
    } else if (lowercaseBukkitSoftware.indexOf('airplane') !== -1) {
      softwareName = 'Airplane';
    } else if (lowercaseBukkitSoftware.indexOf('yatopia') !== -1) {
      softwareName = 'Yatopia';
    } else if (lowercaseBukkitSoftware.indexOf('arclight') !== -1) {
      softwareName = 'Arclight';
    } else if (lowercaseBukkitSoftware.indexOf('magma') !== -1) {
      softwareName = 'Magma';
    } else if (lowercaseBukkitSoftware.indexOf('titanium') !== -1) {
      softwareName = 'Titanium';
    } else if (lowercaseBukkitSoftware.indexOf('scissors') !== -1) {
      softwareName = 'Scissors';
    } else if (lowercaseBukkitSoftware.indexOf('gale') !== -1) {
      softwareName = 'Gale';
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
