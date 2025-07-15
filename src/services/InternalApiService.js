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

  async joinChannel(channelName, data) {
    return await this.post(`/channels/join/${channelName}`, data)
  }

  async partChannel(channelName, data) {
    return await this.post(`/channels/part/${channelName}`, data)
  }

  async getQueueList(channelName) {
    return await this.get(`/channels/${channelName}/queues`);
  }

  async getQueue(queueId) {
    return await this.get(`/queues/${queueId}`);
  }

  async getActiveQueueItems(queueId) {
    return await this.get(`/queues/${queueId}/items`);
  }

  async createQueue(channelName, username, queueData) {
    return await this.post(`/queues/newQueue/${channelName}/${username}`, queueData);
  }

  async deleteQueue(channelId, queueId) {
    return await this.delete(`/queues/${channelId}/${queueId}`);
  }

  async updateQueue(queueId, queueData) {
    return await this.put(`/queues/${queueId}/config`, queueData);
  }
  
  async reorderItem(queueId, data) {
    return await this.put(`/queues/${queueId}`, data);
  } 

  async addQueueItem(queueId, itemData) {
    return await this.post(`/queues/addItem/${queueId}`, itemData);
  }
  
  async removeQueueItem(queueId, itemId) {
    return await this.delete(`/queues/${queueId}/items/${itemId}`);
  }
  
  async completeQueueItem(queueId, itemId) {
    return await this.post(`/queues/${queueId}/items/${itemId}/complete`);
  }

  async updateQueueItem(queueId, itemId, itemData) {
    return await this.put(`/queues/${queueId}/items/${itemId}`, itemData);
  }

  async getCompletedQueueItems(queueId, page = 1, limit = 50) {
    return await this.get(`/queues/${queueId}/completed?page=${page}&limit=${limit}`);
  }

  async removeCompletedQueueItem(queueId, itemId) {
    return await this.delete(`/queues/${queueId}/completed/${itemId}`);
  }
}

export default new InternalApiService();
