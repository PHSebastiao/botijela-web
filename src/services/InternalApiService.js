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

  async getActiveQueueItems(queueId) {
    return await this.get(`/queues/${queueId}/items`);
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

  async addQueueItem(queueId, itemData) {
    return await this.post(`/queues/${queueId}/items`, itemData);
  }
  
  async removeQueueItem(queueId, itemId, itemData) {
    return await this.delete(`/queues/${queueId}/items/${itemId}`, itemData);
  }

  async updateQueueItem(queueId, itemId, itemData) {
    return await this.put(`/queues/${queueId}/items/${itemId}`, itemData);
  }
}

export default new InternalApiService();
