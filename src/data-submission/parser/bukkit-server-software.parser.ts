import { Injectable, Logger } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
} from '../dto/submit-data.dto';
import { Parser } from './interfaces/parser.interface';
import { DefaultChart } from '../../charts/interfaces/charts/default-chart.interface';

const serverSoftwareBrands = new Map<string, string>();
serverSoftwareBrands.set('bukkit', 'Bukkit'); // https://github.com/Bukkit/Bukkit, EOL
serverSoftwareBrands.set('taco', 'TacoSpigot'); // https://github.com/TacoSpigot/TacoSpigot, EOL
serverSoftwareBrands.set('paper', 'Paper'); // https://github.com/PaperMC/Paper
serverSoftwareBrands.set('folia', 'Folia'); // https://github.com/PaperMC/Folia
serverSoftwareBrands.set('spigot', 'Spigot'); // https://hub.spigotmc.org/stash/projects/SPIGOT/repos/spigot/browse
serverSoftwareBrands.set('catserver', 'CatServer'); // https://github.com/Luohuayu/CatServer/
serverSoftwareBrands.set('lava', 'Lava'); // https://github.com/Timardo/Lava, EOL
serverSoftwareBrands.set('mohist', 'Mohist'); // https://github.com/MohistMC/Mohist
serverSoftwareBrands.set('tuinity', 'Tuinity'); // https://github.com/Tuinity/Tuinity, EOL
serverSoftwareBrands.set('purpur', 'Purpur'); // https://github.com/PurpurMC/Purpur
serverSoftwareBrands.set('airplane', 'Airplane'); // https://github.com/TECHNOVE/Airplane, EOL
serverSoftwareBrands.set('yatopia', 'Yatopia'); // https://github.com/YatopiaMC/Yatopia, EOL
serverSoftwareBrands.set('arclight', 'Arclight'); // https://github.com/IzzelAliz/Arclight
serverSoftwareBrands.set('magma', 'Magma'); // https://github.com/magmafoundation/Magma, EOL
serverSoftwareBrands.set('titanium', 'Titanium'); // https://github.com/Mythic-Projects/Titanium, EOL
serverSoftwareBrands.set('scissors', 'Scissors'); // https://github.com/AtlasMediaGroup/Scissors
serverSoftwareBrands.set('gale', 'Gale'); // https://github.com/GaleMC/Gale
serverSoftwareBrands.set('glowstone', 'Glowstone'); // https://github.com/GlowstoneMC/Glowstone, EOL
serverSoftwareBrands.set('pufferfish', 'Pufferfish'); // https://github.com/pufferfish-gg/Pufferfish
serverSoftwareBrands.set('leaves', 'Leaves'); // https://github.com/LeavesMC/Leaves
serverSoftwareBrands.set('leaf', 'Leaf'); // https://github.com/Winds-Studio/Leaf
serverSoftwareBrands.set('universespigot', 'UniverseSpigot'); // TODO: Find link
serverSoftwareBrands.set('advancedslimepaper', 'AdvancedSlimePaper'); //github.com/InfernalSuite/AdvancedSlimePaper
serverSoftwareBrands.set('carbon', 'Carbon'); // https://github.com/InfernalSuite/AdvancedSlimePaper
serverSoftwareBrands.set('ketting', 'Ketting'); // https://github.com/kettingpowered/Ketting-1-20-x
serverSoftwareBrands.set('axolotlspigot', 'AxolotlSpigot'); // https://www.axolotlspigot.com/
serverSoftwareBrands.set('axolotl', 'AxolotlSpigot'); // https://www.axolotlspigot.com/
serverSoftwareBrands.set('plazma', 'Plazma'); // https://github.com/PlazmaMC/PlazmaBukkit
serverSoftwareBrands.set('slimeworldmanager', 'SlimeWorldManager'); // https://www.spigotmc.org/resources/slimeworldmanager.69974/ EOL: Now AdvancedSlimePaper
serverSoftwareBrands.set('divinemc', 'DivineMC'); // https://github.com/BX-Team/DivineMC

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
