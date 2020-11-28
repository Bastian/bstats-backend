import { Body, Controller, Ip, Param, Post } from '@nestjs/common';
import { SubmitDataDto } from './dto/submit-data.dto';
import { DataSubmissionService } from './data-submission.service';

@Controller('submitData')
export class DataSubmissionController {
  constructor(private dataSubmissionService: DataSubmissionService) {}

  @Post()
  async submitDataOld(@Body() submitDataDto: SubmitDataDto, @Ip() ip: string) {
    return this.dataSubmissionService.submitData('bukkit', submitDataDto, ip);
  }

  @Post(':softwareUrl')
  async submitData(
    @Param('softwareUrl') softwareUrl: string,
    @Body() submitDataDto: SubmitDataDto,
    @Ip() ip: string,
  ) {
    return this.dataSubmissionService.submitData(
      softwareUrl,
      submitDataDto,
      ip,
    );
  }
}
