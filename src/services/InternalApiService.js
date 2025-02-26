import config from "../config/index.js";
import BaseApiService from "./BaseApiService.js";

const API_URL = config.apiUrl;
class InternalApiService extends BaseApiService {
  constructor() {
    super(API_URL);
    // super(API_URL, {
    //   header: {
    //     "Authorization": `Bearer ${config.apiKey}`,
    //   }
    // });
  }

  async createUser(userData) {
    return this.post("/auth/user", userData);
  }

  async getUsers() {
    return this.get("/users");
  }
}

export default new InternalApiService();
