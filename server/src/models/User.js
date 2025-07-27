import client from '../config/redisClient.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const USER_PREFIX = 'user:';
const USER_SESSION_PREFIX = 'session:';
const ACTIVE_USERS_SET = 'active_users';

export class User {
  constructor({ id, username, password, isOnline = false, lastSeen = new Date(), socketId = null }) {
    this.id = id || uuidv4();
    this.username = username;
    this.password = password;
    this.isOnline = isOnline;
    this.lastSeen = lastSeen;
    this.socketId = socketId;
  }

  static async findByUsername(username) {
    try {
      const userData = await client.hGetAll(`${USER_PREFIX}${username}`);
      if (!userData || !userData.id) return null;
      
      return new User({
        id: userData.id,
        username: userData.username,
        password: userData.password,
        isOnline: userData.isOnline === 'true',
        lastSeen: new Date(userData.lastSeen),
        socketId: userData.socketId
      });
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const usernames = await client.keys(`${USER_PREFIX}*`);
      for (const key of usernames) {
        const userData = await client.hGetAll(key);
        if (userData.id === id) {
          return new User({
            id: userData.id,
            username: userData.username,
            password: userData.password,
            isOnline: userData.isOnline === 'true',
            lastSeen: new Date(userData.lastSeen),
            socketId: userData.socketId
          });
        }
      }
      return null;
    } catch (error) {
      throw new Error(`Error finding user by ID: ${error.message}`);
    }
  }

  async save() {
    try {
      // Hash password before saving if it's not already hashed
      let hashedPassword = this.password;
      if (this.password && !this.password.startsWith('$2a$')) {
        const saltRounds = 12;
        hashedPassword = await bcrypt.hash(this.password, saltRounds);
      }

      const userData = {
        id: this.id,
        username: this.username,
        password: hashedPassword,
        isOnline: this.isOnline.toString(),
        lastSeen: this.lastSeen.toISOString(),
        socketId: this.socketId || ''
      };

      await client.hSet(`${USER_PREFIX}${this.username}`, userData);
      
      if (this.isOnline) {
        await client.sAdd(ACTIVE_USERS_SET, this.username);
      } else {
        await client.sRem(ACTIVE_USERS_SET, this.username);
      }

      return this;
    } catch (error) {
      throw new Error(`Error saving user: ${error.message}`);
    }
  }

  async setOnline(socketId) {
    this.isOnline = true;
    this.socketId = socketId;
    this.lastSeen = new Date();
    return await this.save();
  }

  async setOffline() {
    this.isOnline = false;
    this.socketId = null;
    this.lastSeen = new Date();
    return await this.save();
  }

  static async getActiveUsers() {
    try {
      const usernames = await client.sMembers(ACTIVE_USERS_SET);
      const users = [];
      
      for (const username of usernames) {
        const user = await User.findByUsername(username);
        if (user && user.isOnline) {
          users.push({
            id: user.id,
            username: user.username,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen
          });
        }
      }
      
      return users;
    } catch (error) {
      throw new Error(`Error getting active users: ${error.message}`);
    }
  }

  async comparePassword(plainPassword) {
    try {
      return await bcrypt.compare(plainPassword, this.password);
    } catch (error) {
      throw new Error(`Error comparing password: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      username: this.username,
      isOnline: this.isOnline,
      lastSeen: this.lastSeen
    };
  }
}

export default User;