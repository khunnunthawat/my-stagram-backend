import { EntityRepository, Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { UserCredentialDto } from './dto/user-credential.dto';
import { UnauthorizedException } from '@nestjs/common';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@EntityRepository(UserEntity)
export class UserRepository extends Repository<UserEntity> {
  // SingUp
  async createUser(userCredentialDto: UserCredentialDto): Promise<UserEntity> {
    const { username, password } = userCredentialDto;
    const salt = bcrypt.genSaltSync(); // ทำการซ่อน password

    const user = new UserEntity();
    user.username = username;
    user.salt = salt;
    // user.password = password;
    user.password = await this.hashPassword(password, salt); // ทำการไปเรียกใช้ function ข้างล่าง

    try {
      await user.save();
    } catch (error) {
      console.log(error);
      if (error.code === '23505') {
        throw new ConflictException(
          'Error, because this username already exist!',
        );
      } else {
        throw new InternalServerErrorException();
      }
    }
    return user;
  }

  // SingIn
  async verifyUserPassword(
    userCredentialDto: UserCredentialDto,
  ): Promise<string> {
    const { username, password } = userCredentialDto;
    const user = await this.findOne({ username });
    if (user && (await user.verifyPassword(password))) {
      return user.username;
    } else {
      throw new UnauthorizedException('Invalid username or password');
    }
  }

  // ซ่อนรหัส
  async hashPassword(password: string, salt: string): Promise<string> {
    return bcrypt.hash(password, salt);
  }
}
