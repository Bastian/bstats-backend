import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  SubmitDataCustomChartDto,
  SubmitDataDto,
  SubmitDataServiceDto,
} from './dto/submit-data.dto';
import { SoftwareService } from '../software/software.service';
import { DateUtilService } from '../charts/date-util.service';
import { ServicesService } from '../services/services.service';
import { ChartsService } from '../charts/charts.service';
import { assertIsDefinedOrThrowNotFound } from '../assertions';
import { RatelimitService } from './ratelimit.service';
import { ParserService } from './parser.service';
import { NameInRequestParser } from './parser/name-in-request.parser';
import { GeoIpService } from './geo-ip.service';
import { ChartDataProcessorService } from './chart-data-processor.service';
import { TooManyRequestsException } from '../exceptions/TooManyRequestsException';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DataSubmissionService {
  private readonly logger = new Logger(DataSubmissionService.name);

  constructor(
    private softwareService: SoftwareService,
    private ratelimitService: RatelimitService,
    private geoIpService: GeoIpService,
    private servicesService: ServicesService,
    private dateUtilService: DateUtilService,
    private chartsService: ChartsService,
    private parserService: ParserService,
    private nameInRequestParser: NameInRequestParser,
    private chartDataProcessorService: ChartDataProcessorService,
    private configService: ConfigService,
  ) {}

  async submitServiceData(
    softwareUrl: string,
    submitDataDto: SubmitDataDto,
    ip: string,
    isGlobalService: boolean,
  ) {
    const software = await this.softwareService.findOneByUrl(softwareUrl);
    assertIsDefinedOrThrowNotFound(software);
    const tms2000 = this.dateUtilService.dateToTms2000(new Date());

    await this.ratelimitService.checkRatelimits(
      submitDataDto,
      software,
      ip,
      tms2000,
    );

    // If there's a global service for the software, call this method recursively
    if (software.globalPlugin != null && !isGlobalService) {
      const globalService = await this.servicesService.findOne(
        software.globalPlugin,
      );
      if (globalService !== null) {
        try {
          await this.submitServiceData(
            softwareUrl,
            {
              ...submitDataDto,
              service: new SubmitDataServiceDto(globalService.id, []),
            },
            ip,
            true,
          );
        } catch (e) {
          if (e instanceof TooManyRequestsException) {
            // Can be ignored
          } else {
            this.logger.error('Failed to process global service');
            this.logger.error(e);
          }
        }
      }
    }

    const [countryName, geo] = this.geoIpService.lookupIp(ip) ?? [null, null];

    const requestRandom = Math.random();

    const defaultCharts: SubmitDataCustomChartDto[] = [];

    for (let i = 0; i < software.defaultCharts.length; i++) {
      const chart = software.defaultCharts[i];

      this.parserService
        .findParser(chart)
        ?.parse(chart, submitDataDto, requestRandom, countryName)
        ?.forEach((c) => defaultCharts.push(c));
    }

    const service = await this.servicesService.findOne(
      submitDataDto.service.id,
      true,
    );
    assertIsDefinedOrThrowNotFound(service);

    // Someone send a faked request for a global service
    if (service?.isGlobal && !isGlobalService) {
      throw new UnauthorizedException();
    }

    if (this.hasBlockedWords(submitDataDto)) {
      this.logger.log(
        `Blocked incoming request for blocked words from ip ${ip}. Content is "${JSON.stringify(
          submitDataDto,
        )}"`,
      );
      throw new BadRequestException();
    }

    // Add default charts as "fake" custom charts
    defaultCharts.forEach((defaultGlobalChart) =>
      submitDataDto.service.customCharts.push(defaultGlobalChart),
    );

    const pipelineChartUpdater = this.chartsService.getPipelinedChartUpdater(
      service.id,
    );

    const promises = submitDataDto.service.customCharts.map(
      async (customChartData) => {
        const chart = service?.charts?.find(
          (c) => c.idCustom == customChartData.chartId,
        );

        if (chart == null) {
          return;
        }

        if (
          chart.isDefault &&
          customChartData.requestRandom !== requestRandom
        ) {
          // The service is trying to trick us and sent a default chart as a custom chart
          return;
        }

        await this.chartDataProcessorService
          .findChartDataProcessor(chart)
          ?.processData(
            chart,
            customChartData,
            tms2000,
            geo,
            pipelineChartUpdater,
          );
      },
    );

    await Promise.all(promises);
    await pipelineChartUpdater.exec();
  }

  hasBlockedWords(submitDataDto: SubmitDataDto) {
    const blockedWords = JSON.parse(
      this.configService.get<string>('WORD_BLOCKLIST', '[]'),
    );
    if (blockedWords.length < 0) {
      return;
    }

    const stringified = JSON.stringify(submitDataDto);
    return (
      blockedWords.find((word) => stringified.includes(word)) !== undefined
    );
  }
}
