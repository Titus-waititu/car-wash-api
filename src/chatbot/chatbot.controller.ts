import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateChatbotDto, ChatQueryDto } from './dto/create-chatbot.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';

@UseGuards(RolesGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR)
  async chat(@Body() chatQueryDto: ChatQueryDto) {
    return this.chatbotService.processQuery(chatQueryDto);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR)
  async create(@Body() createChatbotDto: CreateChatbotDto) {
    return this.chatbotService.create(createChatbotDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR)
  async findOne(@Param('id') id: string) {
    const convo = await this.chatbotService.findOne(id);
    if (!convo) {
      throw new HttpException('Conversation not found', HttpStatus.NOT_FOUND);
    }
    return convo;
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR)
  async remove(@Param('id') id: string) {
    return this.chatbotService.remove(id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR)
  async findByUser(@Query('userId') userId: string) {
    if (!userId) {
      throw new HttpException(
        'Missing userId query param',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.chatbotService['chatbotRepository'].find({ where: { userId } });
  }
}
