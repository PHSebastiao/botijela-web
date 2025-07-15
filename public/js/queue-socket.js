// Queue Socket Integration
// Handles real-time socket communication for queue operations

class QueueSocketManager {
  constructor() {
    this.isInitialized = false;
    this.refreshTimers = {
      queues: new Map(),
      allQueues: null,
    };
    this.notificationQueue = [];
    this.maxNotifications = 5;
    this.notificationWindow = 10000; // 10 seconds
  }

  // Initialize socket connection for queue management
  initialize() {
    if (this.isInitialized) return;

    // Check if socket configuration is available
    if (!window.socketConfig || !window.socketConfig.partyKitHost) {
      console.log("PartyKit not configured, skipping socket connection");
      return;
    }

    const { partyKitHost, currentChannel, user } = window.socketConfig;

    if (!currentChannel) {
      console.log("No current channel, skipping socket connection");
      return;
    }

    // Initialize socket manager
    window.socketManager.init(partyKitHost);

    let sessionId = this.getSessionId();

    // Connect to current channel
    window.socketManager.connectToChannel(currentChannel, user.username, sessionId);

    // Set up event handlers for queue updates
    this.setupEventHandlers();

    this.isInitialized = true;
  }

  // Get session ID from cookie or generate one
  getSessionId() {
    if (typeof getSessionId === "function") {
      return getSessionId();
    }

    // Fallback session ID generation
    let sessionId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("connect.sid="))
      ?.split("=")[1];

    if (!sessionId) {
      sessionId = "anonymous-" + Math.random().toString(36).substr(2, 9);
    }

    return sessionId;
  }

  // Set up socket event handlers for queue operations
  setupEventHandlers() {
    // Queue item events
    window.socketManager.on("itemAdded", (data) => {
      this.handleRealtimeItemChange(data, "added");
    });

    window.socketManager.on("itemUpdated", (data) => {
      this.handleRealtimeItemChange(data, "updated");
    });

    window.socketManager.on("itemRemoved", (data) => {
      this.handleRealtimeItemChange(data, "removed");
    });

    window.socketManager.on("itemCompleted", (data) => {
      this.handleRealtimeItemChange(data, "completed");
    });

    window.socketManager.on("itemMoved", (data) => {
      this.handleRealtimeItemChange(data, "moved");
    });

    window.socketManager.on("queueCleared", (data) => {
      this.handleRealtimeQueueChange(data, "cleared");
    });

    // Queue-level events
    window.socketManager.on("queueAdded", (data) => {
      this.handleRealtimeQueueChange(data, "added");
    });

    window.socketManager.on("queueRemoved", (data) => {
      this.handleRealtimeQueueChange(data, "removed");
    });

    window.socketManager.on("queueUpdated", (data) => {
      this.handleRealtimeQueueChange(data, "updated");
    });

    // Connection events
    window.socketManager.on("connectionEstablished", (data) => {
      this.handleConnectionEstablished(data);
    });
    window.socketManager.on("connectionLeft", (data) => {
      this.handleConnectionLeft(data);
    });

    window.socketManager.on("chatMessage", (data) => {
      this.handleChatMessage(data);
    });

    window.socketManager.on("connected", (data) => {
      console.log("Connected to queue socket for channel:", data.channelName);
      this.updateConnectionStatus(true);
    });

    window.socketManager.on("disconnected", (data) => {
      console.log(
        "Disconnected from queue socket for channel:",
        data.channelName
      );
      this.updateConnectionStatus(false);
    });

    window.socketManager.on("error", (data) => {
      console.error("Socket error for channel:", data.channelName, data.error);
      this.updateConnectionStatus(false);
    });
  }

  // Broadcast queue operations to other users
  broadcastQueueOperation(type, channelName, queueId, data) {
    if (window.socketManager) {
      const username = window.socketConfig?.user?.username || "Unknown";
      window.socketManager.sendMessage(
        type,
        channelName,
        queueId,
        data,
        username
      );
    }
  }

  // Handle channel switching
  switchToChannel(channelName) {
    if (!window.socketManager) return;

    const sessionId = this.getSessionId();
    window.socketManager.switchChannel(channelName, sessionId);
  }

  // Debounced queue item refresh
  debouncedRefreshQueueItems(queueId) {
    if (this.refreshTimers.queues.has(queueId)) {
      clearTimeout(this.refreshTimers.queues.get(queueId));
    }

    this.refreshTimers.queues.set(
      queueId,
      setTimeout(() => {
        this.refreshQueueItems(queueId);
        this.refreshTimers.queues.delete(queueId);
      }, 300)
    );
  }

  // Debounced all queues refresh
  debouncedRefreshAllQueues() {
    if (this.refreshTimers.allQueues) {
      clearTimeout(this.refreshTimers.allQueues);
    }

    this.refreshTimers.allQueues = setTimeout(() => {
      this.refreshQueueList();
      this.refreshTimers.allQueues = null;
    }, 500);
  }

  // Handle realtime item changes
  handleRealtimeItemChange(data, action) {
    const { queueId, username, data: itemData } = data;
    const currentUser = window.socketConfig?.user?.username;

    // Only refresh for actions by OTHER users
    if (username && username !== currentUser) {
      // Debounced reload of specific queue's items
      this.debouncedRefreshQueueItems(queueId);
    }

    const userText = ` by ${username}`;
    let itemName = itemData?.itemName || itemData?.name || "";
    itemName = itemName == "undefined" ? "" : itemName;

    let message;
    let type;
    if (!itemData?.message) {
      switch (action) {
        case "added":
          message = `Item added: ${itemName}${userText}`;
          type = "success";
          break;
        case "updated":
          message = `Item updated: ${itemName}${userText}`;
          type = "info";
          break;
        case "removed":
          message = `Item removed: ${itemName}${userText}`;
          type = "warning";
          break;
        case "completed":
          message = `Item completed: ${itemName}${userText}`;
          type = "info";
          break;
        case "moved":
          message = `Queue reordered${userText}`;
          type = "info";
          break;
        default:
          message = `Item ${action}${userText}`;
          type = "info";
      }
    } else message = itemData?.message;

    this.showRealtimeNotification(type, message);
  }

  // Handle realtime queue changes
  handleRealtimeQueueChange(data, action) {
    const { queueId, username, data: queueData } = data;

    // Debounced reload of all queues
    this.debouncedRefreshAllQueues();

    const userText = ` by ${username}`;
    const queueName = queueData?.queueName || queueData?.name || "";

    let message;
    let type;
    switch (action) {
      case "added":
        message = `Queue created: ${queueName}${userText}`;
        type = "success";
        break;
      case "updated":
        message = `Queue updated: ${queueName}${userText}`;
        type = "info";
        break;
      case "removed":
        message = `Queue deleted: ${queueName}${userText}`;
        type = "warning";
        break;
      case "cleared":
        message = `Queue cleared: ${queueName}${userText}`;
        type = "warning";
        break;
      default:
        message = `Queue ${action}${userText}`;
        type = "info";
    }

    this.showRealtimeNotification(type, message);
  }

  // Refresh the entire queue list
  refreshQueueList() {
    if (typeof window.refreshQueueList === "function") {
      window.refreshQueueList();
    }
  }

  // Refresh specific queue items
  refreshQueueItems(queueId) {
    if (typeof window.refreshQueueItems === "function") {
      window.refreshQueueItems(queueId);
    }
  }

  // Show realtime notifications with rate limiting
  showRealtimeNotification(type, message) {
    const now = Date.now();

    // Clean old notifications
    while (
      this.notificationQueue.length > 0 &&
      now - this.notificationQueue[0] > this.notificationWindow
    ) {
      this.notificationQueue.shift();
    }

    // Rate limit notifications
    if (this.notificationQueue.length >= this.maxNotifications) {
      console.log(`[RATE LIMITED] ${type.toUpperCase()}: ${message}`);
      return;
    }

    this.notificationQueue.push(now);

    if (typeof showToast === "function") {
      showToast(type, message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Handle connection established event
  handleConnectionEstablished(data) {
    const { channelName, username, data: connectionData, timestamp } = data;
    console.log(
      `Connection established for channel: ${channelName}`,
      connectionData
    );
  }
  // Handle connection left event
  handleConnectionLeft(data) {
    const { channelName, username, data: connectionData, timestamp } = data;
    console.log(
      `Connection left the channel: ${channelName}`,
      connectionData
    );
  }

  // Handle chat message event
  handleChatMessage(data) {
    const { channelName, username, data: messageData, timestamp } = data;
    console.log(
      `Chat message from ${username} in ${channelName}:`,
      messageData
    );
  }

  // Connection status indicator
  updateConnectionStatus(isConnected) {
    let $indicator = $(".connection-status");

    if ($indicator.length === 0) {
      $indicator = $(`
        <div class="connection-status" style="position: fixed; bottom: 20px; right: 20px; 
             padding: 8px 12px; border-radius: 4px; font-size: 12px; z-index: 9999;
             transition: all 0.3s ease;">
          <i class="bi bi-wifi"></i>
          <span class="status-text">Connected</span>
        </div>
      `);
      $("body").append($indicator);
    }

    if (isConnected) {
      $indicator
        .removeClass("disconnected")
        .addClass("connected")
        .css({
          "background-color": "#d4edda",
          color: "#155724",
          border: "1px solid #c3e6cb",
        })
        .find(".status-text")
        .text("Connected");
      $indicator.find("i").removeClass("bi-wifi-off").addClass("bi-wifi");
    } else {
      $indicator
        .removeClass("connected")
        .addClass("disconnected")
        .css({
          "background-color": "#f8d7da",
          color: "#721c24",
          border: "1px solid #f5c6cb",
        })
        .find(".status-text")
        .text("Disconnected");
      $indicator.find("i").removeClass("bi-wifi").addClass("bi-wifi-off");
    }

    // Auto-hide after 2 seconds when connected
    if (isConnected) {
      setTimeout(() => {
        $indicator.fadeOut(300);
      }, 2000);
    } else {
      $indicator.show();
    }
  }

  // Cleanup method
  cleanup() {
    // Clear all debounce timers
    Object.values(this.refreshTimers.queues).forEach(clearTimeout);
    if (this.refreshTimers.allQueues)
      clearTimeout(this.refreshTimers.allQueues);

    // Clear notification queue
    this.notificationQueue.length = 0;

    this.isInitialized = false;
  }
}

// Global socket manager instance
window.queueSocketManager = new QueueSocketManager();

// Expose key functions globally for backward compatibility
window.broadcastQueueOperation = (type, channelName, queueId, data) => {
  window.queueSocketManager.broadcastQueueOperation(
    type,
    channelName,
    queueId,
    data
  );
};

window.showRealtimeNotification = (type, message) => {
  window.queueSocketManager.showRealtimeNotification(type, message);
};
