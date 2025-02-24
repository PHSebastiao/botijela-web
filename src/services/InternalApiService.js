

const API_URL = process.env.BOT_API_URL;

import BaseApiService from "./baseApiService.js";

class InternalApiService extends BaseApiService {
  constructor() {
    super(API_URL);
  }
  
  async createUser(userData) {
    return this.post('/auth/user', userData);
  }

  async getUsers() {
    return this.get('/users');
  }
}

export default new InternalApiService();
