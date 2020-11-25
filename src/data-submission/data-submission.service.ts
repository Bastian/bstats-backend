import { Injectable } from '@nestjs/common';
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
  isNameInRequestParser,
  isPredefinedValueParser,
} from '../charts/interfaces/charts/default-chart.interface';
import { isSimplePieChart } from '../charts/interfaces/charts/single-pie-chart.interface';
import { isSimpleMapDataChart } from '../charts/interfaces/charts/simple-map-chart.interface';
import { isSingleLineChart } from '../charts/interfaces/charts/single-line-chart.interface';
import { ServicesService } from '../services/services.service';
import { Service } from '../services/interfaces/service.interface';
import { ChartsService } from '../charts/charts.service';
import { isDrilldownPieChart } from '../charts/interfaces/charts/drilldown-pie-chart.interface';
import { isAdvancedPieChart } from '../charts/interfaces/charts/advanced-pie-chart.interface';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { OsParser } from './parser/os.parser';
import { JavaVersionParser } from './parser/java-version.parser';
import { Parser } from './parser/interfaces/parser.interface';
import { BukkitMinecraftVersionParser } from './parser/bukkit-minecraft-version.parser';
import { BukkitServerSoftwareParser } from './parser/bukkit-server-software.parser';
import { BugeecordVersionParser } from './parser/bugeecord-version.parser';
import { PredefinedValueParser } from './parser/predefined-value.parser';
import { NameInRequestParser } from './parser/name-in-request.parser';

@Injectable()
export class DataSubmissionService {
  constructor(
    private softwareService: SoftwareService,
    private servicesService: ServicesService,
    private dateUtilService: DateUtilService,
    private chartsService: ChartsService,
    private osParser: OsParser,
    private javaVersionParser: JavaVersionParser,
    private bukkitMinecraftVersionParser: BukkitMinecraftVersionParser,
    private bukkitServerSoftwareParser: BukkitServerSoftwareParser,
    private bugeecordVersionParser: BugeecordVersionParser,
    private predefinedValueParser: PredefinedValueParser,
    private nameInRequestParser: NameInRequestParser,
  ) {}

  async submitData(softwareUrl: string, submitDataDto: SubmitDataDto) {
    const software = await this.softwareService.findOneByUrl(softwareUrl);
    assertIsDefinedOrThrowNotFound(software);
    const tms2000 = this.dateUtilService.dateToTms2000(new Date());

    // TODO Ratelimiting
    // TODO Lookup location with ip

    const requestRandom = Math.random();

    const defaultGlobalCharts: SubmitDataCustomChartDto[] = [];
    const defaultPluginCharts: DefaultChart[] = [];

    for (let i = 0; i < software.defaultCharts.length; i++) {
      const chart = software.defaultCharts[i];

      if (isNameInRequestParser(chart.requestParser)) {
        if (chart.requestParser.position === 'plugin') {
          defaultPluginCharts.push(chart);
        }
      }

      this.findParser(chart)
        ?.parse(chart, submitDataDto, null, requestRandom)
        ?.forEach((c) => defaultGlobalCharts.push(c));
    }

    // If there's a global plugin for the software, add it as a "fake" plugin to the request
    if (software.globalPlugin != null) {
      const globalPlugin = await this.servicesService.findOne(
        software.globalPlugin,
      );
      if (globalPlugin !== null) {
        submitDataDto.plugins.push(
          new SubmitDataPluginDto(
            globalPlugin.id,
            globalPlugin.name,
            [],
            requestRandom,
          ),
        );
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
          this.nameInRequestParser
            .parse(
              defaultPluginChart,
              submitDataDto,
              serviceWithData.data,
              requestRandom,
            )
            ?.forEach((c) => serviceWithData.data.customCharts.push(c));
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
        if (chart === null) {
          return;
        }
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
            tms2000,
            '1',
            value,
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
          return this.chartsService.updateMapData(chart.id, tms2000, value, 1);
        } else {
          return;
        }
      });

    await Promise.all(promises);
  }

  private findParser(chart: DefaultChart): Parser | null {
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
          return this.bugeecordVersionParser;
      }
    }

    if (isNameInRequestParser(chart.requestParser)) {
      return this.nameInRequestParser;
    }

    return null;
  }
}
