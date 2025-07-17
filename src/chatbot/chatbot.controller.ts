import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { CreateChatbotDto, ChatQueryDto } from './dto/create-chatbot.dto';
import { UpdateChatbotDto } from './dto/update-chatbot.dto';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('chat')
  async chat(@Body() chatQueryDto: ChatQueryDto) {
    return this.chatbotService.processQuery(chatQueryDto);
  }

  @Get('conversation/:sessionId')
  async getConversationBySession(@Param('sessionId') sessionId: string) {
    return this.chatbotService.findBySession(sessionId);
  }

  @Get('user/:userId/conversations')
  async getUserConversations(@Param('userId') userId: string) {
    return this.chatbotService.findByUser(userId);
  }

  @Post()
  create(@Body() createChatbotDto: CreateChatbotDto) {
    return this.chatbotService.create(createChatbotDto);
  }

  @Get()
  findAll() {
    return this.chatbotService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chatbotService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChatbotDto: UpdateChatbotDto) {
    return this.chatbotService.update(id, updateChatbotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chatbotService.remove(id);
  }
}
