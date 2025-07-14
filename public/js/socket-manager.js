(async () => {
  const { PartySocket } = await import(
    "https://cdn.jsdelivr.net/npm/partysocket@1.1.4/+esm"
  );

  class SocketManager {
  constructor() {
    this.connections = new Map();
    this.currentChannel = null;
    this.partyKitHost = null; // Will be set from server config
    this.eventHandlers = new Map();
  }

  // Initialize with PartyKit host from server config
  init(partyKitHost) {
    this.partyKitHost = partyKitHost;
    console.log("SocketManager initialized with host:", partyKitHost);
  }

  // Connect to a specific channel's room
  connectToChannel(channelName, sessionId) {
    if (!this.partyKitHost) {
      console.error("PartyKit host not configured");
      return null;
    }

    const roomId = `${channelName}`;
    const connectionKey = `${roomId}-${sessionId}`;

    // If already connected to this channel with this session, return existing connection
    if (this.connections.has(connectionKey)) {
      console.log("Reusing existing connection for:", connectionKey);
      return this.connections.get(connectionKey);
    }

    // Create new PartySocket connection
    const socket = new PartySocket({
      host: this.partyKitHost,
      room: roomId,
      query: {
        sessionId: sessionId,
        channelName: channelName,
      },
    });

    // Set up event listeners
    this.setupSocketListeners(socket, channelName, sessionId);

    // Store connection
    this.connections.set(connectionKey, socket);
    this.currentChannel = channelName;

    console.log("Connected to PartyKit room:", roomId);
    return socket;
  }

  // Set up socket event listeners
  setupSocketListeners(socket, channelName, sessionId) {
    socket.addEventListener("open", () => {
      console.log(`Connected to channel: ${channelName}`);
      this.triggerEvent("connected", { channelName, sessionId });
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);
        this.handleMessage(data, channelName);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    socket.addEventListener("error", (error) => {
      console.error("Socket error:", error);
      this.triggerEvent("error", { error, channelName });
    });

    socket.addEventListener("close", () => {
      console.log(`Disconnected from channel: ${channelName}`);
      this.triggerEvent("disconnected", { channelName, sessionId });
    });
  }

  // Handle incoming messages
  handleMessage(data, channelName) {
    const {
      type,
      channelName: messageChannelName,
      username,
      queueId,
      data: payload,
      timestamp,
    } = data;

    switch (type) {
      case "connection-established":
        this.triggerEvent("connectionEstablished", {
          channelName: messageChannelName,
          username,
          data: payload,
          timestamp,
        });
        break;
      case "message":
        this.triggerEvent("chatMessage", {
          channelName: messageChannelName,
          username,
          data: payload,
          timestamp,
        });
        break;
      case "item-added":
        this.triggerEvent("itemAdded", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "item-updated":
        this.triggerEvent("itemUpdated", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "item-removed":
        this.triggerEvent("itemRemoved", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "item-completed":
        this.triggerEvent("itemCompleted", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "item-moved":
        this.triggerEvent("itemMoved", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "queue-cleared":
        this.triggerEvent("queueCleared", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "queue-added":
        this.triggerEvent("queueAdded", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "queue-removed":
        this.triggerEvent("queueRemoved", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      case "queue-updated":
        this.triggerEvent("queueUpdated", {
          channelName: messageChannelName,
          username,
          queueId,
          data: payload,
          timestamp,
        });
        break;
      default:
        console.warn("Unknown message type:", type);
    }
  }

  // Send message to current channel
  sendMessage(type, channelName, queueId, data, username) {
    const socket = this.getCurrentSocket();
    if (socket && socket.readyState === socket.OPEN) {
      const message = JSON.stringify({
        type,
        channelName,
        username,
        queueId,
        data,
        timestamp: Date.now(),
      });
      socket.send(message);
    } else {
      console.warn("Socket not connected or not ready");
    }
  }

  // Get current socket connection
  getCurrentSocket() {
    if (!this.currentChannel) return null;

    const sessionId = getSessionId();
    const connectionKey = `${this.currentChannel}-${sessionId}`;
    return this.connections.get(connectionKey);
  }

  // Disconnect from a specific channel
  disconnectFromChannel(channelName, sessionId) {
    const connectionKey = `${channelName}-${sessionId}`;
    const socket = this.connections.get(connectionKey);

    if (socket) {
      socket.close();
      this.connections.delete(connectionKey);
      console.log("Disconnected from channel:", channelName);
    }
  }

  // Switch to a different channel (disconnect from current, connect to new)
  switchChannel(newChannelName, sessionId) {
    // Disconnect from current channel
    if (this.currentChannel) {
      this.disconnectFromChannel(this.currentChannel, sessionId);
    }

    // Connect to new channel
    return this.connectToChannel(newChannelName, sessionId);
  }

  // Event handler system
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  triggerEvent(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error("Error in event handler:", error);
        }
      });
    }
  }

  // Cleanup all connections
  cleanup() {
    this.connections.forEach((socket, key) => {
      socket.close();
    });
    this.connections.clear();
    this.eventHandlers.clear();
    console.log("All socket connections cleaned up");
  }
}

window.socketManager = new SocketManager();

})();
