import { Injectable, NotFoundException } from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataPluginDto,
} from './dto/submit-data.dto';
import { SoftwareService } from '../software/software.service';
import { DateUtilService } from '../charts/date-util.service';
import {
  DefaultChart,
  isHardcodedParser,
  isNameInRequestBoolParser,
  isNameInRequestNumberParser,
  isNameInRequestParser,
  isPredefinedValueParser,
} from '../charts/interfaces/default-chart.interface';
import { isSimplePieChart } from '../charts/interfaces/single-pie-chart.interface';
import { isSimpleMapDataChart } from '../charts/interfaces/simple-map-chart.interface';
import { isSingleLineChart } from '../charts/interfaces/single-line-chart.interface';
import { ServicesService } from '../services/services.service';
import { Service } from '../services/interfaces/service.interface';
import { ChartsService } from '../charts/charts.service';
import { isDrilldownPieChart } from '../charts/interfaces/drilldown-pie-chart.interface';
import { isAdvancedPieChart } from '../charts/interfaces/advanced-pie-chart.interface';
import { assertIsDefined } from '../assertions';

@Injectable()
export class DataSubmissionService {
  constructor(
    private softwareService: SoftwareService,
    private servicesService: ServicesService,
    private dateUtilService: DateUtilService,
    private chartsService: ChartsService,
  ) {}

  async submitData(softwareUrl: string, submitDataDto: SubmitDataDto) {
    const software = await this.softwareService.findOneByUrl(softwareUrl);
    const tms2000 = this.dateUtilService.dateToTms2000(new Date());
    // TODO Ratelimiting
    // TODO Lookup location with ip

    const requestRandom = Math.random();

    const defaultGlobalCharts: SubmitDataCustomChartDto[] = [];
    const defaultPluginCharts: DefaultChart[] = [];

    function mapDefaultChartToFakeCustomChart(
      value: any,
      chart: DefaultChart,
    ): SubmitDataCustomChartDto | undefined {
      if (isNameInRequestNumberParser(chart.requestParser)) {
        if (typeof value !== 'number') {
          return;
        }
      } else if (isNameInRequestBoolParser(chart.requestParser)) {
        if (typeof value === 'number') {
          value = value !== 0;
        } else {
          return;
        }
      } else {
        if (typeof value !== 'string') {
          return;
        }
      }

      if (isSimplePieChart(chart) || isSimpleMapDataChart(chart)) {
        value = value.toString();
      } else if (isSingleLineChart(chart)) {
        if (chart.data.filter?.enabled) {
          const { minValue, maxValue } = chart.data.filter;
          if (typeof maxValue === 'number' && value > maxValue) {
            value = maxValue;
          } else if (typeof minValue === 'number' && value <= minValue) {
            value = minValue;
          }
        }
      } else {
        return;
      }

      return new SubmitDataCustomChartDto(
        chart.idCustom,
        { value },
        requestRandom,
      );
    }

    for (let i = 0; i < software.defaultCharts.length; i++) {
      const chart = software.defaultCharts[i];

      if (isPredefinedValueParser(chart.requestParser)) {
        let value = chart.requestParser.predefinedValue;
        if (value === '%country.name%') {
          // TODO Get country name
          value = 'Unknown';
        }
        defaultGlobalCharts.push(
          new SubmitDataCustomChartDto(
            chart.idCustom,
            { value },
            requestRandom,
          ),
        );
      }

      if (isHardcodedParser(chart.requestParser)) {
        switch (chart.requestParser.useHardcodedParser) {
          case 'os':
            const { osName, osVersion } = submitDataDto;
            if (typeof osName !== 'string' || typeof osVersion !== 'string') {
              continue;
            }
            const operatingSystemChart = new SubmitDataCustomChartDto(
              'os',
              { values: {} },
              requestRandom,
            );
            if (osName.startsWith('Windows Server')) {
              operatingSystemChart.data.values['Windows Server'] = {};
              operatingSystemChart.data.values['Windows Server'][osName] = 1;
            } else if (osName.startsWith('Windows NT')) {
              operatingSystemChart.data.values['Windows NT'] = {};
              operatingSystemChart.data.values['Windows NT'][osName] = 1;
            } else if (osName.startsWith('Windows')) {
              operatingSystemChart.data.values['Windows'] = {};
              operatingSystemChart.data.values['Windows'][osName] = 1;
            } else if (osName.startsWith('Linux')) {
              operatingSystemChart.data.values['Linux'] = {};
              operatingSystemChart.data.values['Linux'][osVersion] = 1;
            } else if (osName.startsWith('Mac OS X')) {
              operatingSystemChart.data.values['Mac OS X'] = {};
              operatingSystemChart.data.values['Mac OS X'][
                'Mac OS X ' + osVersion
              ] = 1;
            } else if (osName.indexOf('BSD') !== -1) {
              operatingSystemChart.data.values['BSD'] = {};
              operatingSystemChart.data.values['BSD'][
                osName + ' ' + osVersion
              ] = 1;
            } else {
              operatingSystemChart.data.values['Other'] = {};
              operatingSystemChart.data.values['Other'][
                osName + ' (' + osVersion + ')'
              ] = 1;
            }
            defaultGlobalCharts.push(operatingSystemChart);
            continue;
          case 'javaVersion':
            const { javaVersion } = submitDataDto;
            if (typeof javaVersion !== 'string') {
              continue;
            }
            const javaVersionChart = new SubmitDataCustomChartDto(
              'javaVersion',
              { values: {} },
              requestRandom,
            );
            if (javaVersion.startsWith('1.7')) {
              javaVersionChart.data.values['Java 7'] = {};
              javaVersionChart.data.values['Java 7'][javaVersion] = 1;
            } else if (javaVersion.startsWith('1.8')) {
              javaVersionChart.data.values['Java 8'] = {};
              javaVersionChart.data.values['Java 8'][javaVersion] = 1;
            } else if (
              javaVersion.startsWith('9') ||
              javaVersion === '1.9.0-ea'
            ) {
              //java 9 changed the version format to 9.0.1 and 1.9.0 is only used for early access
              //reference: http://openjdk.java.net/jeps/223
              javaVersionChart.data.values['Java 9'] = {};
              javaVersionChart.data.values['Java 9'][javaVersion] = 1;
            } else if (javaVersion.startsWith('10')) {
              javaVersionChart.data.values['Java 10'] = {};
              javaVersionChart.data.values['Java 10'][javaVersion] = 1;
            } else if (javaVersion.startsWith('11')) {
              javaVersionChart.data.values['Java 11'] = {};
              javaVersionChart.data.values['Java 11'][javaVersion] = 1;
            } else if (javaVersion.startsWith('12')) {
              javaVersionChart.data.values['Java 12'] = {};
              javaVersionChart.data.values['Java 12'][javaVersion] = 1;
            } else if (javaVersion.startsWith('13')) {
              javaVersionChart.data.values['Java 13'] = {};
              javaVersionChart.data.values['Java 13'][javaVersion] = 1;
            } else if (javaVersion.startsWith('14')) {
              javaVersionChart.data.values['Java 14'] = {};
              javaVersionChart.data.values['Java 14'][javaVersion] = 1;
            } else if (javaVersion.startsWith('15')) {
              javaVersionChart.data.values['Java 15'] = {};
              javaVersionChart.data.values['Java 15'][javaVersion] = 1;
            } else if (javaVersion.startsWith('16')) {
              javaVersionChart.data.values['Java 16'] = {};
              javaVersionChart.data.values['Java 16'][javaVersion] = 1;
            } else if (javaVersion.startsWith('17')) {
              javaVersionChart.data.values['Java 17'] = {};
              javaVersionChart.data.values['Java 17'][javaVersion] = 1;
            } else if (javaVersion.startsWith('18')) {
              javaVersionChart.data.values['Java 18'] = {};
              javaVersionChart.data.values['Java 18'][javaVersion] = 1;
            } else if (javaVersion.startsWith('19')) {
              javaVersionChart.data.values['Java 19'] = {};
              javaVersionChart.data.values['Java 19'][javaVersion] = 1;
            } else if (javaVersion.startsWith('20')) {
              javaVersionChart.data.values['Java 20'] = {};
              javaVersionChart.data.values['Java 20'][javaVersion] = 1;
            } else {
              javaVersionChart.data.values['Other'] = {};
              javaVersionChart.data.values['Other'][javaVersion] = 1;
            }
            defaultGlobalCharts.push(javaVersionChart);
            continue;
          case 'bukkitMinecraftVersion':
            if (typeof submitDataDto.bukkitVersion !== 'string') {
              continue;
            }

            let version = submitDataDto.bukkitVersion;
            // If it does contain "MC: ", it's from an new bStats Metrics class
            if (submitDataDto.bukkitVersion.indexOf('MC:') !== -1) {
              const parsed = /.+\(MC: ([\d\\.]+)\)/gm.exec(
                submitDataDto.bukkitVersion,
              );
              version = parsed != null ? parsed[1] : 'Failed to parse';
            }

            defaultGlobalCharts.push(
              new SubmitDataCustomChartDto(
                chart.idCustom,
                { value: version },
                requestRandom,
              ),
            );
            continue;
          case 'bukkitServerSoftware':
            if (typeof submitDataDto.bukkitVersion !== 'string') {
              continue;
            }

            // If it doesn't contain "MC: ", it's from an old bStats Metrics class
            if (submitDataDto.bukkitVersion.indexOf('MC:') === -1) {
              continue;
            }

            const lowercaseBukkitVersion = submitDataDto.bukkitVersion.toLowerCase();
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

            defaultGlobalCharts.push(
              new SubmitDataCustomChartDto(
                chart.idCustom,
                { value: softwareName },
                requestRandom,
              ),
            );
            continue;
          case 'bungeecordVersion':
            const { bungeecordVersion } = submitDataDto;
            if (!bungeecordVersion) {
              continue;
            }
            const split = bungeecordVersion.split(':');
            defaultGlobalCharts.push(
              new SubmitDataCustomChartDto(
                chart.idCustom,
                { value: split.length > 2 ? split[2] : bungeecordVersion },
                requestRandom,
              ),
            );
            continue;
          default:
            continue;
        }
      }

      if (isNameInRequestParser(chart.requestParser)) {
        const { nameInRequest, position } = chart.requestParser;
        if (position === 'plugin') {
          defaultPluginCharts.push(chart);
        }
        if (position !== 'global') {
          continue;
        }
        const fakeCustomChart = mapDefaultChartToFakeCustomChart(
          submitDataDto[nameInRequest],
          chart,
        );
        if (fakeCustomChart) {
          defaultGlobalCharts.push(fakeCustomChart);
        }
      }

      // If there's a global plugin for the software, add it as a "fake" plugin to the request
      if (software.globalPlugin != null) {
        try {
          const globalPlugin = await this.servicesService.findOne(
            software.globalPlugin,
          );
          submitDataDto.plugins.push(
            new SubmitDataPluginDto(
              globalPlugin.id,
              globalPlugin.name,
              [],
              requestRandom,
            ),
          );
        } catch (e) {
          if (!(e instanceof NotFoundException)) {
            throw e;
          }
        }
      }

      // Find the service that belongs to the request
      const servicesWithData: Array<{
        service: Service | null;
        data: SubmitDataPluginDto;
      }> = await Promise.all(
        submitDataDto.plugins.map(async (data) => {
          if (typeof data.id === 'number') {
            return {
              service: await this.servicesService.findOne(data.id),
              data,
            };
          } else if (typeof data.pluginName === 'string') {
            return {
              service: await this.servicesService.findBySoftwareUrlAndName(
                softwareUrl,
                data.pluginName,
              ),
              data,
            };
          } else {
            return { service: null, data };
          }
        }),
      );

      const handledServiceIds: Set<number> = new Set();
      const promises: Promise<unknown>[] = servicesWithData
        .filter(
          (
            serviceWithData,
          ): serviceWithData is {
            service: Service;
            data: SubmitDataPluginDto;
          } => serviceWithData.service !== null,
        )
        // Remove duplicates
        .filter(({ service }) => {
          if (handledServiceIds.has(service.id)) {
            return false;
          }
          handledServiceIds.add(service.id);
          return true;
        })
        // Filter "faked" global plugins
        .filter(
          ({ service, data }) =>
            !service.isGlobal || data.requestRandom === requestRandom,
        )
        // Add default global charts as "fake" custom charts
        .map((serviceWithData) => {
          defaultGlobalCharts.forEach((defaultGlobalChart) =>
            serviceWithData.data.customCharts.push(defaultGlobalChart),
          );
          return serviceWithData;
        })
        // Add default charts as "fake" custom charts
        .map((serviceWithData) => {
          for (const defaultPluginChart of defaultPluginCharts) {
            if (!isNameInRequestParser(defaultPluginChart.requestParser)) {
              continue;
            }
            const fakeCustomChart = mapDefaultChartToFakeCustomChart(
              serviceWithData[defaultPluginChart.requestParser.nameInRequest],
              defaultPluginChart,
            );
            if (fakeCustomChart) {
              serviceWithData.data.customCharts.push(fakeCustomChart);
            }
          }
          return serviceWithData;
        })
        .flatMap(({ service, data }) =>
          data.customCharts.map((customChartData) => ({
            service,
            customChartData,
          })),
        )
        // Update data of all charts
        .map(async ({ service, customChartData }) => {
          const chart = await this.chartsService.findByServiceIdAndCustomId(
            service.id,
            customChartData.chartId,
          );
          if (isSimplePieChart(chart)) {
            if (
              typeof customChartData.data !== 'object' ||
              typeof customChartData.data.value !== 'string'
            ) {
              return;
            }
            return this.chartsService.updatePieData(
              chart.id,
              tms2000,
              customChartData.data.value,
              1,
            );
          } else if (isAdvancedPieChart(chart)) {
            if (
              typeof customChartData.data !== 'object' ||
              typeof customChartData.data.values !== 'object'
            ) {
              return;
            }
            const promises: Promise<unknown>[] = [];
            for (const value in customChartData.data.values) {
              if (
                !customChartData.data.values.hasOwnProperty(value) ||
                typeof customChartData.data.values[value] !== 'number'
              ) {
                continue;
              }
              promises.push(
                this.chartsService.updatePieData(
                  chart.id,
                  tms2000,
                  value,
                  customChartData.data.values[value],
                ),
              );
            }
            return Promise.all(promises);
          } else if (isDrilldownPieChart(chart)) {
            if (
              typeof customChartData.data !== 'object' ||
              typeof customChartData.data.values !== 'object'
            ) {
              return;
            }
            const promises: Promise<unknown>[] = [];
            for (const value in customChartData.data.values) {
              if (
                !customChartData.data.values.hasOwnProperty(value) ||
                typeof customChartData.data.values[value] !== 'object'
              ) {
                continue;
              }
              promises.push(
                this.chartsService.updateDrilldownPieData(
                  chart.id,
                  tms2000,
                  value,
                  customChartData.data.values[value],
                ),
              );
            }
            return Promise.all(promises);
          } else if (isSingleLineChart(chart)) {
            if (
              typeof customChartData.data !== 'object' ||
              typeof customChartData.data.value !== 'number'
            ) {
              return;
            }
            let { value } = customChartData.data;
            if (chart.data.filter !== undefined && chart.data.filter.enabled) {
              const maxValue = chart.data.filter.maxValue;
              const minValue = chart.data.filter.minValue;
              if (typeof maxValue === 'number' && value > maxValue) {
                value = maxValue;
              } else if (typeof minValue === 'number' && value <= minValue) {
                value = minValue;
              }
            }
            return this.chartsService.updateLineChartData(
              chart.id,
              value,
              '1',
              tms2000,
            );
          } else if (isSimpleMapDataChart(chart)) {
            if (
              typeof customChartData.data !== 'object' ||
              typeof customChartData.data.value !== 'string'
            ) {
              return;
            }
            const { value } = customChartData.data;
            if (value === 'AUTO') {
              // TODO Set value to current country
              return;
            }
            return this.chartsService.updateMapData(
              chart.id,
              tms2000,
              value,
              1,
            );
          } else {
            return;
          }
        });

      await Promise.all(promises);
    }
  }
}
