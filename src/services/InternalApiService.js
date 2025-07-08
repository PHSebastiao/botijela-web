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
    return await this.post("/auth/user", userData);
  }

  async getModeratedChannels(userId) {
    return await this.get(`/channel/${userId}/moderatedChannels`);
  }

  async getManagedChannelInfo(channelName) {
    return await this.get(`/channels/${channelName}`);
  }

  async getQueueList(channelName) {
    return await this.get(`/channels/${channelName}/queues`);
  }

  async createQueue(channelName, queueData) {
    return await this.post(`/queues/${channelName}`, queueData);
  }

  async deleteQueue(channelId, queueId) {
    return await this.delete(`/queues/${channelId}/${queueId}`);
  }
  
  async reorderItem(queueId, data) {
    return await this.put(`/queues/${queueId}`, data);
  }
}

export default new InternalApiService();
