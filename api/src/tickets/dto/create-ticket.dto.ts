import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateTicketDto {
  @ApiProperty({ example: 'Amaya Perera' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  customerName: string;

  @ApiProperty({ example: 'amaya@example.com' })
  @Transform(trim)
  @IsEmail()
  @MaxLength(200)
  customerEmail: string;

  @ApiProperty({ example: 'Charged twice for my order' })
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    example: 'I was charged twice for order #4521 and still have not received a refund.',
  })
  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  message: string;
}
