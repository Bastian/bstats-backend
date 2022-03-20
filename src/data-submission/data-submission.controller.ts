import { Body, Controller, Param, Post } from '@nestjs/common';
import { SubmitDataDto } from './dto/submit-data.dto';
import { DataSubmissionService } from './data-submission.service';
import { IpAddress } from '../ip-address.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('data')
@ApiTags('data')
export class DataSubmissionController {
  constructor(private dataSubmissionService: DataSubmissionService) {}

  @Post(':softwareUrl')
  async submitData(
    @Param('softwareUrl') softwareUrl: string,
    @Body() submitDataDto: SubmitDataDto,
    @IpAddress() ip: string,
  ) {
    return this.dataSubmissionService.submitServiceData(
      softwareUrl,
      submitDataDto,
      ip,
      false,
    );
  }
}
