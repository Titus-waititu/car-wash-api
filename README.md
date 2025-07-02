# 🚗 Car Wash Web Application API

A comprehensive Car Wash management system built with NestJS, TypeORM, and PostgreSQL. This API provides a complete solution for managing car wash services, bookings, fleet vehicles, user reviews, and more.

## 🚀 Features

- **User Management**: Customer, vendor, admin, fleet manager, and support staff roles
- **Service Management**: Create and manage various car wash services
- **Booking System**: Schedule and manage car wash appointments
- **Fleet Management**: Track and manage service vehicles
- **Review System**: Customer feedback and rating system
- **Authentication**: JWT-based authentication with refresh tokens
- **Payment Integration**: Support for multiple payment methods
- **API Documentation**: Interactive Swagger documentation
- **Caching**: Redis-based caching for improved performance
- **Rate Limiting**: Protection against excessive API requests

## 🛠️ Tech Stack

- **Backend**: NestJS (Node.js framework)
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT tokens with Passport
- **Caching**: Redis with ioredis
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator and class-transformer
- **Security**: Helmet, CORS, Rate limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- pnpm package manager

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd car-wash-api
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=your_db_username
   DATABASE_PASSWORD=your_db_password
   DATABASE_NAME=car_wash_db
   TYPEORM_SYNC=true
   TYPEORM_LOGGING=false

   # Redis Configuration
   REDIS_URL=redis://localhost:6379

   # JWT Configuration
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_jwt_refresh_secret

   # Application Configuration
   PORT=8080

   # Cache Configuration
   CACHE_TTL=60000

   # Rate Limiting
   THROTTLE_TTL=60
   THROTTLE_LIMIT=100
   ```

4. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb car_wash_db
   ```

## 🚀 Running the Application

```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run start:prod

# Watch mode
pnpm run start
```

The API will be available at `http://localhost:8080`

## 📚 API Documentation

Interactive API documentation is available at:

- **Swagger UI**: `http://localhost:8080/api/docs`

## 🔗 API Endpoints

### Users

- `GET /users` - Get all users
- `POST /users` - Create a new user
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Services

- `GET /services` - Get all services
- `POST /services` - Create a new service
- `GET /services/:id` - Get service by ID
- `GET /services/user/:userId` - Get services by user
- `GET /services/price-range` - Get services by price range
- `PATCH /services/:id` - Update service
- `DELETE /services/:id` - Delete service

### Bookings

- `GET /bookings` - Get all bookings
- `POST /bookings` - Create a new booking
- `GET /bookings/:id` - Get booking by ID
- `GET /bookings/stats` - Get booking statistics
- `GET /bookings/user/:userId` - Get bookings by user
- `GET /bookings/service/:serviceId` - Get bookings by service
- `PATCH /bookings/:id` - Update booking
- `PATCH /bookings/:id/status` - Update booking status
- `DELETE /bookings/:id` - Delete booking

### Fleet

- `GET /fleet` - Get all vehicles
- `POST /fleet` - Add new vehicle
- `GET /fleet/:id` - Get vehicle by ID
- `GET /fleet/stats` - Get fleet statistics
- `GET /fleet/available` - Get available vehicles
- `GET /fleet/user/:userId` - Get vehicles by user
- `PATCH /fleet/:id` - Update vehicle
- `PATCH /fleet/:id/status` - Update vehicle status
- `DELETE /fleet/:id` - Delete vehicle

### Reviews

- `GET /reviews` - Get all reviews
- `POST /reviews` - Create a new review
- `GET /reviews/:id` - Get review by ID
- `GET /reviews/stats` - Get review statistics
- `GET /reviews/user/:userId` - Get reviews by user
- `GET /reviews/top` - Get top-rated reviews
- `PATCH /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

## 🧪 Testing

Use the provided `app.http` file to test API endpoints with VS Code REST Client extension.

```bash
# Run unit tests
pnpm run test

# Run e2e tests
pnpm run test:e2e

# Run test coverage
pnpm run test:cov
```

## 🔒 Authentication

The API uses JWT-based authentication:

1. **Register/Login**: Create account or login to get access token
2. **Authorization Header**: Include `Bearer <token>` in requests
3. **Refresh Token**: Use refresh endpoint to get new access token

## 📊 Database Schema

The application uses the following main entities:

- **Users**: Customer and staff management
- **Services**: Car wash service definitions
- **Bookings**: Appointment scheduling
- **Fleet**: Service vehicle management
- **Reviews**: Customer feedback
- **Payments**: Transaction records

## 🚦 Error Handling

The API returns structured error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## 🛡️ Security Features

- **Helmet**: Security headers protection
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling
- **Input Validation**: Request data validation
- **SQL Injection Protection**: TypeORM query protection

## 📈 Performance Features

- **Redis Caching**: Fast data retrieval
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Efficient database connections
- **Pagination**: Large dataset handling

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

For support and questions:

- Create an issue in the repository
- Contact the development team

## 🗺️ Roadmap

- [ ] Mobile API endpoints
- [ ] Real-time notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] API versioning
- [ ] Microservices architecture
      $ pnpm run test

# e2e tests

$ pnpm run test:e2e

# test coverage

$ pnpm run test:cov

````

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
````

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
