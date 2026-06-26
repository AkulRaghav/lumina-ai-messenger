import {
  IsBoolean,
  IsArray,
  IsString,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';

export class CreateChatDto {
  @IsBoolean()
  isGroup: boolean;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(256)
  memberIds: string[];
}
