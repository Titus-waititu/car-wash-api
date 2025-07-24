import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateChatbotDto, ChatQueryDto } from './dto/create-chatbot.dto';
// import { UpdateChatbotDto } from './dto/update-chatbot.dto';
import { Chatbot, ChatResponse } from './entities/chatbot.entity';
import { ServicesService } from '../services/services.service';
import { BookingsService } from '../bookings/bookings.service';
import { CarWashLocationService } from '../car-wash-location/car-wash-location.service';
import { UsersService } from '../users/users.service';
import { FleetService } from '../fleet/fleet.service';
import { ReviewsService } from '../reviews/reviews.service';
import { PaymentsService } from '../payments/payments.service';
// import Together from 'together-ai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectRepository(Chatbot)
    private chatbotRepository: Repository<Chatbot>,
    private servicesService: ServicesService,
    private bookingsService: BookingsService,
    private carWashLocationService: CarWashLocationService,
    private usersService: UsersService,
    private fleetService: FleetService,
    private reviewsService: ReviewsService,
    private paymentsService: PaymentsService,
    private readonly configService: ConfigService,
  ) {}

  async processQuery(chatQueryDto: ChatQueryDto): Promise<ChatResponse> {
    const { query, userId } = chatQueryDto;
    const sessionId = this.generateSessionId();

    try {
      // Store the conversation
      const conversation = await this.createConversation({
        message: query,
        userId,
        sessionId,
      });

      // Process the query and generate response
      const response = await this.generateResponse(query.toLowerCase(), userId);

      // Update conversation with response
      conversation.response = response.response;
      await this.chatbotRepository.save(conversation);

      return {
        ...response,
        conversationId: conversation.id,
      };
    } catch (error) {
      this.logger.error('Error processing chat query:', error);
      return {
        response:
          'I apologize, but I encountered an error processing your request. Please try again.',
        suggestions: [
          'Try rephrasing your question',
          'Ask about our services',
          'Check booking status',
        ],
      };
    }
  }

  private async generateResponse(
    query: string,
    userId?: string,
  ): Promise<ChatResponse> {
    // Intent detection based on keywords
    const intent = this.detectIntent(query);

    switch (intent) {
      case 'services':
        return await this.handleServicesQuery(query);

      case 'bookings':
        return await this.handleBookingsQuery(query,userId);

      case 'locations':
        return await this.handleLocationsQuery(query);

      case 'pricing':
        return await this.handlePricingQuery(query);

      case 'reviews':
        return await this.handleReviewsQuery(query);

      case 'fleet':
        return await this.handleFleetQuery(query);

      case 'payments':
        return await this.handlePaymentsQuery(userId);

      case 'account':
        return await this.handleAccountQuery(userId);

      case 'greeting':
        return this.handleGreeting();

      case 'help':
        return this.handleHelp();

      case 'booking_guide':
        return this.handleBookingGuide();

      default: {
        // If user asks for a guide or process, provide a booking guide
        if (
          /\b(guide|how to|process|steps|book a service|make a booking|booking process)\b/i.test(
            query,
          )
        ) {
          return this.handleBookingGuide();
        }
        // For queries not handled by chatbot, use Together AI model, fallback to improved general
        const aiResponse = await this.handleTogetherAIQuery(query);
        if (
          aiResponse.response.includes('could not generate') ||
          aiResponse.response.includes('trouble generating') ||
          aiResponse.response.trim().length < 10
        ) {
          return this.handleGeneralQuery(query, userId);
        }
        return aiResponse;
      }
    }
  }

  // New: Booking process guide (moved outside generateResponse)
  private handleBookingGuide(): ChatResponse {
    return {
      response: `Here's a quick guide to booking a car wash service with us:\n\n1. **View Services**: Browse our available car wash and detailing services.\n2. **Choose a Service**: Select the service that best fits your needs.\n3. **Pick a Location**: Choose your preferred car wash location.\n4. **Select Date & Time**: Pick a convenient date and time for your appointment.\n5. **Confirm Booking**: Provide your details and confirm your booking.\n6. **Get Confirmation**: You'll receive a confirmation message with your booking details.\n\nIf you need help at any step, just let me know! Would you like to start booking now?`,
      suggestions: [
        'View services',
        'Find locations',
        'Book now',
        'Talk to support',
      ],
    };
  }
  // Remove the extra closing brace here that was left after moving handleBookingGuide

  private async handleTogetherAIQuery(query: string): Promise<ChatResponse> {
    try {
      const TogetherAI = require('together-ai');
      const together = new TogetherAI({
        apiKey: this.configService.getOrThrow<string>('TOGETHER_API_KEY'),
      });
      const response = await together.chat.completions.create({
        messages: [{ role: 'user', content: query }],
        model: 'meta-llama/Llama-Vision-Free',
        stream: false,
      });
      // If response is an array (stream), join tokens; else, get content
      let aiResponse = '';
      if (Array.isArray(response)) {
        for await (const token of response) {
          aiResponse += token.choices[0]?.delta?.content || '';
        }
      } else {
        aiResponse =
          response.choices?.[0]?.message?.content ||
          'Sorry, I could not generate a response.';
      }
      return {
        response: aiResponse,
        suggestions: ['Ask another question', 'Get help', 'View services'],
      };
    } catch (error) {
      this.logger.error('Together AI error:', error);
      return {
        response:
          'I had trouble generating a response. Please try again or ask about our car wash services.',
        suggestions: ['Try again', 'Get help', 'View services'],
      };
    }
  }

  private detectIntent(query: string): string {
    const keywords = {
      services: [
        'service',
        'wash',
        'cleaning',
        'detail',
        'wax',
        'polish',
        'what services',
        'available services',
      ],
      bookings: [
        'book',
        'appointment',
        'schedule',
        'reserve',
        'my booking',
        'booking status',
        'cancel booking',
      ],
      locations: [
        'location',
        'where',
        'address',
        'near me',
        'nearest',
        'branch',
        'center',
      ],
      pricing: [
        'price',
        'cost',
        'how much',
        'rate',
        'fee',
        'charge',
        'expensive',
        'cheap',
      ],
      reviews: [
        'review',
        'rating',
        'feedback',
        'comment',
        'testimonial',
        'experience',
      ],
      fleet: ['vehicle', 'car', 'truck', 'fleet', 'my car', 'add vehicle'],
      payments: [
        'payment',
        'pay',
        'bill',
        'invoice',
        'transaction',
        'credit card',
        'payment history',
      ],
      account: [
        'account',
        'profile',
        'personal',
        'my details',
        'update profile',
      ],
      greeting: [
        'hello',
        'hi',
        'hey',
        'good morning',
        'good afternoon',
        'good evening',
      ],
      help: ['help', 'assist', 'support', 'how to', 'guide', 'tutorial'],
    };

    for (const [intent, intentKeywords] of Object.entries(keywords)) {
      if (intentKeywords.some((keyword) => query.includes(keyword))) {
        return intent;
      }
    }

    return 'general';
  }

  private async handleServicesQuery(query: string): Promise<ChatResponse> {
    try {
      let searchTerm = '';

      // Extract service type from query
      if (query.includes('wash')) searchTerm = 'wash';
      else if (query.includes('detail')) searchTerm = 'detail';
      else if (query.includes('wax')) searchTerm = 'wax';
      else if (query.includes('polish')) searchTerm = 'polish';

      const services = await this.servicesService.findAll(searchTerm);

      if (services.length === 0) {
        return {
          response:
            "I couldn't find any services matching your query. Let me show you all our available services.",
          suggestions: [
            'View all services',
            'Car wash services',
            'Detailing services',
            'Book a service',
          ],
        };
      }

      const serviceList = services
        .slice(0, 5)
        .map(
          (service) =>
            `• **${service.name}** - $${service.price} (${service.description})`,
        )
        .join('\n');

      return {
        response: `Here are the services I found:\n\n${serviceList}${services.length > 5 ? '\n\n*And more...*' : ''}`,
        data: services,
        suggestions: [
          'Book a service',
          'View pricing',
          'Find locations',
          'See reviews',
        ],
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      return {
        response:
          'I had trouble fetching service information. Please try again.',
        suggestions: ['Try again', 'Contact support'],
      };
    }
  }

  private async handleBookingsQuery(
    query: string,
    userId?: string,
  ): Promise<ChatResponse> {
    // Consider userId invalid if it's undefined, null, empty, or a string 'undefined'/'null'
    if (!userId || userId === 'undefined' || userId === 'null') {
      return {
        response: `I can't show your personal bookings because you're not signed in. But you can still explore our services, locations, and pricing! If you want to book or view your bookings, please sign in or create an account.`,
        suggestions: [
          'Sign in',
          'Create account',
          'View services',
          'See booking guide',
          'Find locations',
        ],
      };
    }

    try {
      const bookings = await this.bookingsService.findByUser(userId);

      if (bookings.length === 0) {
        return {
          response:
            "You don't have any bookings yet. Would you like to book a service?",
          suggestions: ['Book a service', 'View services', 'Find locations'],
        };
      }

      const recentBookings = bookings
        .slice(0, 3)
        .map(
          (booking) =>
            `• **${booking.service?.name || 'Service'}** - ${booking.status} (${new Date(booking.booking_time).toLocaleDateString()})`,
        )
        .join('\n');

      return {
        response: `Here are your recent bookings:\n\n${recentBookings}`,
        data: bookings,
        suggestions: [
          'Book another service',
          'View booking details',
          'Cancel booking',
        ],
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      return {
        response:
          'I had trouble fetching your booking information. Please try again.',
        suggestions: ['Try again', 'Contact support'],
      };
    }
  }

  private async handleLocationsQuery(query: string): Promise<ChatResponse> {
    try {
      const locations = await this.carWashLocationService.findAll();

      if (locations.length === 0) {
        return {
          response:
            "I couldn't find any locations at the moment. Please contact support for assistance.",
          suggestions: ['Contact support', 'View services'],
        };
      }

      const locationList = locations
        .slice(0, 5)
        .map(
          (location) =>
            `• **${location.name}** - ${location.address}\n  Phone: ${location.phone || 'N/A'}`,
        )
        .join('\n\n');

      return {
        response: `Here are our car wash locations:\n\n${locationList}`,
        data: locations,
        suggestions: [
          'Get directions',
          'Book at location',
          'View services',
          'Contact location',
        ],
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      return {
        response:
          'I had trouble fetching location information. Please try again.',
        suggestions: ['Try again', 'Contact support'],
      };
    }
  }

  private async handlePricingQuery(query: string): Promise<ChatResponse> {
    try {
      const services = await this.servicesService.findAll();

      const pricingInfo = services
        .slice(0, 10)
        .map((service) => `• **${service.name}**: $${service.price}`)
        .join('\n');

      return {
        response: `Here's our pricing information:\n\n${pricingInfo}\n\n*Prices may vary by location. Contact us for the most current pricing.*`,
        data: services,
        suggestions: [
          'Book a service',
          'Compare services',
          'Find locations',
          'View packages',
        ],
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      return {
        response:
          'I had trouble fetching pricing information. Please contact us directly for current rates.',
        suggestions: ['Contact support', 'View services'],
      };
    }
  }

  private async handleReviewsQuery(query: string): Promise<ChatResponse> {
    try {
      const reviews = await this.reviewsService.findAll();

      if (!reviews || reviews.length === 0) {
        return {
          response:
            'No reviews available at the moment. Be the first to leave a review!',
          suggestions: ['Book a service', 'Leave a review'],
        };
      }

      const avgRating =
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length;
      const recentReviews = reviews
        .slice(0, 3)
        .map(
          (review) =>
            `• ${review.rating}/5 stars - "${review.comment}" - ${review.user?.username || 'Anonymous'}`,
        )
        .join('\n\n');

      return {
        response: `Our customer reviews (Average: ${avgRating.toFixed(1)}/5 stars):\n\n${recentReviews}`,
        data: reviews,
        suggestions: ['Book a service', 'Read all reviews', 'Leave a review'],
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      return {
        response:
          'I had trouble fetching review information. Please try again.',
        suggestions: ['Try again', 'Contact support'],
      };
    }
  }

  private async handleFleetQuery(query: string): Promise<ChatResponse> {
    return {
      response:
        'I can help you manage your vehicle fleet. You can add vehicles to your account, track their service history, and schedule regular maintenance.',
      suggestions: [
        'Add vehicle',
        'View my vehicles',
        'Schedule service',
        'Service history',
      ],
    };
  }

  private async handlePaymentsQuery(
    // query: string,
    userId?: string,
  ): Promise<ChatResponse> {
    if (!userId) {
      return {
        response:
          'To view payment information, please sign in to your account.',
        suggestions: ['Sign in', 'Payment methods', 'Pricing information'],
      };
    }

    return {
      response:
        'I can help you with payment-related questions. You can view your payment history, update payment methods, or get invoices.',
      suggestions: [
        'Payment history',
        'Update payment method',
        'Get invoice',
        'Payment options',
      ],
    };
  }

  private async handleAccountQuery(
    // query: string,
    userId?: string,
  ): Promise<ChatResponse> {
    if (!userId) {
      return {
        response:
          'To access account information, please sign in to your account.',
        suggestions: ['Sign in', 'Create account', 'Forgot password'],
      };
    }

    try {
      const user = await this.usersService.findOne(userId);
      return {
        response: `Hello ${user.username}! I can help you manage your account settings, view your booking history, or update your profile information.`,
        suggestions: [
          'Update profile',
          'View bookings',
          'Change password',
          'Account settings',
        ],
      };
    } catch (error) {
      console.error('Error fetching services:', error);
      return {
        response:
          'I can help you with account-related questions. What would you like to know?',
        suggestions: ['Update profile', 'View bookings', 'Account settings'],
      };
    }
  }

  private handleGreeting(): ChatResponse {
    const greetings = [
      'Hello! Welcome to our car wash service. How can I help you today?',
      "Hi there! I'm here to assist you with our car wash services. What can I do for you?",
      'Greetings! Ready to get your car sparkling clean? How may I assist you?',
    ];

    return {
      response: greetings[Math.floor(Math.random() * greetings.length)],
      suggestions: [
        'View services',
        'Book appointment',
        'Find locations',
        'Check pricing',
      ],
    };
  }

  private handleHelp(): ChatResponse {
    return {
      response: `I'm here to help! Here's what I can assist you with:

• **Services**: Information about our car wash and detailing services
• **Bookings**: Schedule appointments, check booking status, cancel bookings
• **Locations**: Find car wash locations near you
• **Pricing**: Get pricing information for our services
• **Reviews**: Read customer reviews and ratings
• **Account**: Manage your profile and view booking history
• **Payments**: Handle payment-related questions

Just ask me anything about our car wash services!`,
      suggestions: [
        'View services',
        'Book appointment',
        'Find locations',
        'Check pricing',
      ],
    };
  }

  private handleGeneralQuery(query: string, userId?: string): ChatResponse {
    // More helpful, context-aware fallback
    if (userId) {
      return {
        response:
          `You're logged in! Here are some things you can do next:\n\n` +
          `• **Book a Service**: Schedule a car wash or detailing\n` +
          `• **View Services**: See all our car wash and detailing options\n` +
          `• **Booking History**: Check your past and upcoming bookings\n` +
          `• **Payments**: Review your payment history and invoices\n` +
          `• **Account Settings**: Update your profile and vehicles\n\n` +
          `If you want to book a service, just say "book a service" or ask for a guide!`,
        suggestions: [
          'Book a service',
          'View my bookings',
          'See available services',
          'Check payment history',
          'How do I book?',
        ],
      };
    }
    // Fallback for guests
    return {
      response: `I can help you with anything related to our car wash services, bookings, locations, pricing, and more.\n\nIf you want to book a service, just ask! Or, if you need a step-by-step guide, say "guide me on booking".\n\nWhat would you like to do?`,
      suggestions: [
        'View services',
        'Book appointment',
        'Find locations',
        'How do I book?',
      ],
    };
  }

  private async createConversation(
    createChatbotDto: CreateChatbotDto,
  ): Promise<Chatbot> {
    const conversation = this.chatbotRepository.create({
      message: createChatbotDto.message,
      userId: createChatbotDto.userId,
      sessionId: createChatbotDto.sessionId,
      response: '', // Will be updated later
    });

    return await this.chatbotRepository.save(conversation);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async create(createChatbotDto: CreateChatbotDto) {
    return await this.createConversation(createChatbotDto);
  }

  async findOne(id: string): Promise<Chatbot | null> {
    return await this.chatbotRepository.findOne({ where: { id } });
  }

  async remove(id: string) {
    const conversation = await this.findOne(id);
    if (conversation) {
      await this.chatbotRepository.remove(conversation);
      return { message: 'Conversation deleted successfully' };
    }
    throw new Error('Conversation not found');
  }
}
