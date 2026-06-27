import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/users/models/user.model';
import { RefreshToken } from './modules/auth/models/refresh-token.model';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'mysql',
        host:     config.get('DB_HOST'),
        port:     config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        models:        [User, RefreshToken],
        autoLoadModels: true,
        synchronize:   config.get('NODE_ENV') !== 'production',
        logging:       config.get('NODE_ENV') !== 'production' ? console.log : false,
        define:        { underscored: true },
      }),
    }),
    AuthModule,
  ],
})
export class AppModule {}
