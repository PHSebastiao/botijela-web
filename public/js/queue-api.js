// Queue API Service
// Centralized API service for queue operations with caching and error handling

class QueueAPIService {
  constructor() {}

  // Core request method with caching
  request(url, options = {}) {
    const config = {
      type: options.method || "GET",
      contentType: "application/json",
      ...options,
    };

    if (config.data && typeof config.data === "object") {
      config.data = JSON.stringify(config.data);
    }

    const request = $.ajax(url, config);

    return request.fail((xhr, status, error) => {
      // Enhanced error logging
      console.error(`API Error [${config.type} ${url}]:`, {
        status: xhr.status,
        statusText: xhr.statusText,
        responseText: xhr.responseText,
        error: error,
      });

      // Show user-friendly error message
      let errorMessage = "An unexpected error occurred.";
      if (xhr.responseJSON && xhr.responseJSON.error) {
        errorMessage = xhr.responseJSON.error;
      } else if (xhr.status === 404) {
        errorMessage = "Resource not found.";
      } else if (xhr.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }

      if (typeof showToast === "function") {
        showToast("danger", errorMessage);
      }
    });
  }

  // Queue item operations
  updateItem(queueId, itemId, data) {
    const $item = $(
      `.queue-items[data-queue-id='${queueId}'] [data-item-id='${itemId}']`
    );
    const itemName =
      $item.closest(".queue-item-draggable").find(".queue-item-text").text() ||
      "Item";

    const promise = this.request(`/queue/${queueId}/items/${itemId}`, {
      method: "PUT",
      data,
    });

    promise.done((response) => {
      const channelName = window.socketConfig?.currentChannel;
      if (window.broadcastQueueOperation) {
        window.broadcastQueueOperation("item-updated", channelName, queueId, {
          success: true,
          itemName,
        });
      }
    });

    return promise;
  }

  deleteItem(queueId, itemId) {
    // Get item name from DOM before deletion for broadcasting
    const $item = $(
      `.queue-items[data-queue-id='${queueId}'] [data-item-id='${itemId}']`
    );
    const itemName =
      $item.closest(".queue-item-draggable").find(".queue-item-text").text() ||
      "Item";

    const promise = this.request(`/queue/${queueId}/items/${itemId}`, {
      method: "DELETE",
    });

    promise.done((response) => {
      const channelName = window.socketConfig?.currentChannel;

      if (window.broadcastQueueOperation) {
        window.broadcastQueueOperation("item-removed", channelName, queueId, {
          itemId: itemId,
          itemName: itemName,
        });
      }
    });

    return promise;
  }

  addItem(queueId, data) {
    const promise = this.request(`/queue/${queueId}/items`, {
      method: "POST",
      data,
    });

    const { itemName } = data;

    promise.done((response) => {
      const channelName = window.socketConfig?.currentChannel;

      if (window.broadcastQueueOperation) {
        window.broadcastQueueOperation("item-added", channelName, queueId, {
          success: true,
          itemName,
        });
      }
    });

    return promise;
  }

  completeItem(queueId, itemId) {
    const $item = $(
      `.queue-items[data-queue-id='${queueId}'] [data-item-id='${itemId}']`
    );
    const itemName =
      $item.closest(".queue-item-draggable").find(".queue-item-text").text() ||
      "Item";

    const promise = this.request(`/queue/${queueId}/items/${itemId}/complete`, {
      method: "POST",
    });

    promise.done((response) => {
      const channelName = window.socketConfig?.currentChannel;

      if (window.broadcastQueueOperation) {
        window.broadcastQueueOperation("item-completed", channelName, queueId, {
          success: true,
          itemName,
        });
      }
    });

    return promise;
  }

  reorderItems(queueId, data) {
    const $item = $(
      `.queue-items[data-queue-id='${queueId}'] [data-item-id='${data.itemId}']`
    );
    const itemName =
      $item.closest(".queue-item-draggable").find(".queue-item-text").text() ||
      "Item";

    const promise = this.request(`/queue/${queueId}/reorder`, {
      method: "PUT",
      data,
    });

    promise.done((response) => {
      const channelName = window.socketConfig?.currentChannel;
      if (window.broadcastQueueOperation) {
        window.broadcastQueueOperation("item-moved", channelName, queueId, {
          success: true,
          itemName,
        });
      }
    });

    return promise;
  }

  // Queue operations
  deleteQueue(channelId, queueId) {
    debugger;
    const $item = $(`.queue-items[data-queue-id='${queueId}']`);
    const queueName = $item.data("queueName");
    const promise = this.request(`/queue/${channelId}/${queueId}`, {
      method: "DELETE",
    });

    promise.done((response) => {
      const channelName = window.socketConfig?.currentChannel;
      if (window.broadcastQueueOperation) {
        window.broadcastQueueOperation("queue-removed", channelName, queueId, {
          success: true,
          queueName,
        });
      }
    });

    return promise;
  }

  updateQueue(queueId, data) {
    const $item = $(`.queue-items[data-queue-id='${queueId}']`);
    const queueName = $item.data("queueName");
    const promise = this.request(`/queue/${queueId}`, {
      method: "PUT",
      data,
    });

    promise.done((response) => {
      const channelName = window.socketConfig?.currentChannel;
      if (window.broadcastQueueOperation) {
        window.broadcastQueueOperation("queue-updated", channelName, queueId, {
          success: true,
          queueName,
        });
      }
    });

    return promise;
  }

  getQueue(queueId) {
    return this.request(`/queue/${queueId}/edit`);
  }

  getQueues() {
    return this.request(`/queue/queues`);
  }

  getRewards(queueId) {
    return this.request(`/queue/${queueId}/rewards`);
  }

  getCompletedItems(queueId, page, limit) {
    return this.request(
      `/queue/${queueId}/completed?page=${page}&limit=${limit}`
    );
  }

  removeCompletedItem(queueId, itemId) {
    return this.request(`/queue/${queueId}/completed/${itemId}`, {
      method: "DELETE",
    });
  }
}

// Global API instance
window.QueueAPI = new QueueAPIService();
