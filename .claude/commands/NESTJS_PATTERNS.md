# NestJS Patterns & Conventions

> This file defines how every module, controller, service, and DTO must be structured.
> Follow these patterns exactly. Do not invent alternatives.

---

## Module folder structure

Every module follows this exact layout:

```
modules/jobs/
  dto/
    create-job.dto.ts
    update-job-status.dto.ts
  entities/
    job.entity.ts
  jobs.controller.ts
  jobs.service.ts
  jobs.module.ts
```

No exceptions. Guards, decorators, and interceptors live in `common/` and are shared.

---

## Module template

```typescript
// jobs.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { Job } from './entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],   // export only if another module needs this service
})
export class JobsModule {}
```

---

## Controller template

Controllers ONLY: receive request, validate (via pipes), call service, return response.
Never write database queries, business logic, or conditional branching in controllers.

```typescript
// jobs.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('my')
  getMyJobs(@CurrentUser() user) {
    return this.jobsService.findByUser(user.id);
  }

  @Post()
  createJob(@Body() dto: CreateJobDto, @CurrentUser() user) {
    return this.jobsService.create(dto, user.id);
  }

  @Get(':id')
  getJob(@Param('id') id: string, @CurrentUser() user) {
    return this.jobsService.findOne(id, user.id);
  }
}
```

---

## Service template

Services contain ALL business logic. One service per module.
Always inject repositories via constructor. Never use static methods.

```typescript
// jobs.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
  ) {}

  async findByUser(userId: string): Promise<Job[]> {
    return this.jobRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Job> {
    const job = await this.jobRepo.findOne({ where: { id } });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    if (job.userId !== userId) throw new ForbiddenException();
    return job;
  }

  async create(dto: CreateJobDto, userId: string): Promise<Job> {
    const job = this.jobRepo.create({ ...dto, userId });
    return this.jobRepo.save(job);
  }
}
```

---

## DTO template

Every request body needs a DTO. Use class-validator for all validation.
Never use `any` type. Never skip validation decorators.

```typescript
// create-job.dto.ts
import {
  IsString, IsOptional, IsEnum, IsInt, IsPositive, Min,
  IsNotEmpty, MaxLength,
} from 'class-validator';

export enum ColorMode { BW = 'bw', COLOR = 'color' }
export enum Sides { SINGLE = 'single', DOUBLE = 'double' }
export enum DeliveryType { PICKUP = 'pickup', DELIVERY = 'delivery' }
export enum PaymentMethod { MPESA = 'mpesa', PAY_ON_PICKUP = 'pay_on_pickup' }

export class CreateJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  instructions?: string;

  @IsInt()
  @IsPositive()
  pages: number;

  @IsInt()
  @Min(1)
  copies: number;

  @IsEnum(ColorMode)
  colorMode: ColorMode;

  @IsEnum(Sides)
  sides: Sides;

  @IsString()
  paperSize: string;

  @IsEnum(DeliveryType)
  deliveryType: DeliveryType;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
```

---

## Entity template

Use TypeORM decorators. Always define `createdAt` and `updatedAt`.
Column names in MySQL are snake_case; TypeScript properties are camelCase.

```typescript
// job.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum JobStatus {
  PENDING   = 'pending',
  PRINTING  = 'printing',
  READY     = 'ready',
  DELIVERED = 'delivered',
}

export enum PaymentStatus {
  UNPAID        = 'unpaid',
  PAID          = 'paid',
  PAY_ON_PICKUP = 'pay_on_pickup',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'file_name', nullable: true })
  fileName: string;

  @Column({ name: 'file_url', nullable: true })
  fileUrl: string;

  @Column({ nullable: true, length: 1000 })
  instructions: string;

  @Column({ default: 1 })
  pages: number;

  @Column({ default: 1 })
  copies: number;

  @Column({ name: 'color_mode', default: 'bw' })
  colorMode: string;

  @Column({ default: 'single' })
  sides: string;

  @Column({ name: 'paper_size', default: 'A4' })
  paperSize: string;

  @Column({ name: 'delivery_type', default: 'pickup' })
  deliveryType: string;

  @Column({ name: 'payment_method', default: 'mpesa' })
  paymentMethod: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({ default: 0, type: 'decimal', precision: 10, scale: 2 })
  cost: number;

  @Column({ name: 'delivery_fee', default: 0, type: 'decimal', precision: 10, scale: 2 })
  deliveryFee: number;

  @Column({ name: 'mpesa_ref', nullable: true })
  mpesaRef: string;

  @Column({ name: 'admin_notes', nullable: true, length: 500 })
  adminNotes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## Global response interceptor

Place in `common/interceptors/transform.interceptor.ts`.
This wraps every response in the standard envelope automatically.

```typescript
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'Success',
        data,
      })),
    );
  }
}
```

Register in `main.ts`:
```typescript
app.useGlobalInterceptors(new TransformInterceptor());
```

---

## Global exception filter

Place in `common/filters/http-exception.filter.ts`.
Catches all exceptions and formats them into the standard error envelope.

```typescript
import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? (exception.getResponse() as any).message ?? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message[0] : message,
      errors: Array.isArray(message) ? message : undefined,
    });
  }
}
```

Register in `main.ts`:
```typescript
app.useGlobalFilters(new GlobalExceptionFilter());
```

---

## main.ts setup — always use this exactly

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,         // strip unknown properties
    forbidNonWhitelisted: true,
    transform: true,         // auto-transform primitives
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: config.get('FRONTEND_URL'),
    credentials: true,
  });

  await app.listen(config.get('PORT') ?? 3000);
}
bootstrap();
```

---

## Guards

### JwtAuthGuard — `common/guards/jwt-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### RolesGuard — `common/guards/roles.guard.ts`

```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../modules/users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest();
    return required.includes(user.role);
  }
}
```

---

## Decorators

### @CurrentUser() — `common/decorators/current-user.decorator.ts`

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

### @Roles() — `common/decorators/roles.decorator.ts`

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../modules/users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

---

## ConfigService usage

Never use `process.env` directly. Always inject ConfigService.

```typescript
// In module:
import { ConfigModule, ConfigService } from '@nestjs/config';

// In service constructor:
constructor(private readonly config: ConfigService) {}

// In method:
const key = this.config.get<string>('MPESA_CONSUMER_KEY');
```

---

## Error throwing conventions

```typescript
// Not found
throw new NotFoundException('Job not found');

// Unauthorized
throw new UnauthorizedException('Invalid credentials');

// Forbidden (authenticated but wrong role/ownership)
throw new ForbiddenException('You do not own this job');

// Bad request (business logic failure)
throw new BadRequestException('Job is already paid');

// Always use NestJS built-in HTTP exceptions — never throw raw Error()
```

---

## AppModule — always register modules here

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FilesModule } from './modules/files/files.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    AuthModule,
    UsersModule,
    JobsModule,
    PaymentsModule,
    FilesModule,
    NotificationsModule,
    AdminModule,
  ],
})
export class AppModule {}
```

---

## What the agent must never do in NestJS code

- Never use `synchronize: true` in production (only in development)
- Never import a service from another module without exporting it first
- Never use `@Body()` without a typed DTO
- Never catch exceptions silently — always rethrow or log
- Never use `any` as a return type on service methods
- Never write a controller method longer than 5 lines
