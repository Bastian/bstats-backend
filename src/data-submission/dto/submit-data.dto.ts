import {
  IsArray,
  IsDefined,
  IsEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitDataDto {
  @IsString()
  serverUUID: string;

  @IsArray()
  @ValidateNested()
  @Type(() => SubmitDataPluginDto)
  plugins: SubmitDataPluginDto[];

  @IsOptional()
  @IsString()
  osName?: string;

  @IsOptional()
  @IsString()
  osVersion?: string;

  @IsOptional()
  @IsString()
  javaVersion?: string;

  @IsOptional()
  @IsString()
  bukkitVersion?: string;

  @IsOptional()
  @IsString()
  bungeecordVersion?: string;

  // There can be any arbitrary properties (used with default chart with parser position 'global')
  [key: string]: any;
}

export class SubmitDataPluginDto {
  constructor(
    id?: number,
    pluginName?: string,
    customCharts: SubmitDataCustomChartDto[] = [],
    requestRandom?: number,
  ) {
    this.id = id;
    this.pluginName = pluginName;
    this.customCharts = customCharts;
    this.requestRandom = requestRandom;
  }

  @IsOptional()
  @IsNumber()
  id?: number;

  @IsOptional()
  @IsString()
  pluginName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => SubmitDataCustomChartDto)
  customCharts: SubmitDataCustomChartDto[];

  @IsEmpty() // Must not be send in the request but is added by the code
  requestRandom?: number;

  // There can be any arbitrary properties (used with default chart with parser position 'global')
  [key: string]: any;
}

export class SubmitDataCustomChartDto {
  constructor(chartId: string, data: any, requestRandom?: number) {
    this.chartId = chartId;
    this.data = data;
    this.requestRandom = requestRandom;
  }

  @IsString()
  chartId: string;

  @IsDefined()
  data: any;

  @IsEmpty() // Must not be send in the request but is added by the code
  requestRandom?: number;
}
