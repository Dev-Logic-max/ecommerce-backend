import { IsString } from 'class-validator';

export class RoleRequestDto {
    @IsString()
    requestedRole: string;
}