import { Injectable } from '@nestjs/common';
import {
  DefaultChart,
  isHardcodedParser,
  isNameInRequestParser,
  isPredefinedValueParser,
} from '../charts/interfaces/charts/default-chart.interface';
import { Parser } from './parser/interfaces/parser.interface';
import { OsParser } from './parser/os.parser';
import { JavaVersionParser } from './parser/java-version.parser';
import { BukkitMinecraftVersionParser } from './parser/bukkit-minecraft-version.parser';
import { BukkitServerSoftwareParser } from './parser/bukkit-server-software.parser';
import { BungeecordVersionParser } from './parser/bungeecord-version.parser';
import { PredefinedValueParser } from './parser/predefined-value.parser';
import { NameInRequestParser } from './parser/name-in-request.parser';

@Injectable()
export class ParserService {
  constructor(
    private osParser: OsParser,
    private javaVersionParser: JavaVersionParser,
    private bukkitMinecraftVersionParser: BukkitMinecraftVersionParser,
    private bukkitServerSoftwareParser: BukkitServerSoftwareParser,
    private bungeecordVersionParser: BungeecordVersionParser,
    private predefinedValueParser: PredefinedValueParser,
    private nameInRequestParser: NameInRequestParser,
  ) {}

  findParser(chart: DefaultChart): Parser | null {
    if (isPredefinedValueParser(chart.requestParser)) {
      return this.predefinedValueParser;
    }

    if (isHardcodedParser(chart.requestParser)) {
      switch (chart.requestParser.useHardcodedParser) {
        case 'os':
          return this.osParser;
        case 'javaVersion':
          return this.javaVersionParser;
        case 'bukkitMinecraftVersion':
          return this.bukkitMinecraftVersionParser;
        case 'bukkitServerSoftware':
          return this.bukkitServerSoftwareParser;
        case 'bungeecordVersion':
          return this.bungeecordVersionParser;
      }
    }

    if (isNameInRequestParser(chart.requestParser)) {
      return this.nameInRequestParser;
    }

    return null;
  }
}
