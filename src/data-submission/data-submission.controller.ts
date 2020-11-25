import { Body, Controller, Param, Post } from '@nestjs/common';
import { SubmitDataDto } from './dto/submit-data.dto';
import { DataSubmissionService } from './data-submission.service';

@Controller('submitData')
export class DataSubmissionController {
  constructor(private dataSubmissionService: DataSubmissionService) {}

  @Post()
  async submitDataOld(@Body() submitDataDto: SubmitDataDto) {
    return this.dataSubmissionService.submitData('bukkit', submitDataDto);
  }

  @Post(':softwareUrl')
  async submitData(
    @Param('softwareUrl') softwareUrl: string,
    @Body() submitDataDto: SubmitDataDto,
  ) {
    return this.dataSubmissionService.submitData(softwareUrl, submitDataDto);
  }
}
