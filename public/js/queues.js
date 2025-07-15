// Legacy Queue Management - Redirects to new modular system
// This file is maintained for backward compatibility

// Redirect to new modular system
console.warn("queues.js is deprecated. Please use the new modular system.");

// Initialize the new modular system
$(function () {
  if (typeof initializeQueueManagement === 'function') {
    initializeQueueManagement();
  } else {
    console.error("New modular queue system not loaded. Please check script imports.");
  }
});

// Legacy compatibility functions - these now delegate to the new system
function initializeSortable() {
  if (window.queueUIHelpers) {
    window.queueUIHelpers.initializeSortable();
  }
}

function initializeTooltips() {
  if (window.queueUIHelpers) {
    window.queueUIHelpers.initializeTooltips();
  }
}

function initializeEventDelegation() {
  if (window.queueUIHelpers) {
    window.queueUIHelpers.initializeEventDelegation();
  }
}

function initializeSocketConnection() {
  if (window.queueSocketManager) {
    window.queueSocketManager.initialize();
  }
}

function reRenderQueues(queues) {
  if (window.queueUIHelpers) {
    window.queueUIHelpers.reRenderQueues(queues);
  }
}

function rebuildQueueItems($queueContainer, data, queueId) {
  if (window.queueUIHelpers) {
    window.queueUIHelpers.rebuildQueueItems($queueContainer, data, queueId);
  }
}

// Legacy API object - redirects to new QueueAPI
const QueueAPI = {
  get request() { return window.QueueAPI?.request?.bind(window.QueueAPI); },
  get updateItem() { return window.QueueAPI?.updateItem?.bind(window.QueueAPI); },
  get deleteItem() { return window.QueueAPI?.deleteItem?.bind(window.QueueAPI); },
  get addItem() { return window.QueueAPI?.addItem?.bind(window.QueueAPI); },
  get completeItem() { return window.QueueAPI?.completeItem?.bind(window.QueueAPI); },
  get reorderItems() { return window.QueueAPI?.reorderItems?.bind(window.QueueAPI); },
  get deleteQueue() { return window.QueueAPI?.deleteQueue?.bind(window.QueueAPI); },
  get getQueue() { return window.QueueAPI?.getQueue?.bind(window.QueueAPI); },
  get getQueues() { return window.QueueAPI?.getQueues?.bind(window.QueueAPI); },
  get updateQueue() { return window.QueueAPI?.updateQueue?.bind(window.QueueAPI); },
  get getCompletedItems() { return window.QueueAPI?.getCompletedItems?.bind(window.QueueAPI); },
  get removeCompletedItem() { return window.QueueAPI?.removeCompletedItem?.bind(window.QueueAPI); },
};

// Legacy socket functions
function broadcastQueueOperation(type, channelName, queueId, data) {
  if (window.queueSocketManager) {
    window.queueSocketManager.broadcastQueueOperation(type, channelName, queueId, data);
  }
}

function showRealtimeNotification(type, message) {
  if (window.queueSocketManager) {
    window.queueSocketManager.showRealtimeNotification(type, message);
  }
}

function switchToChannel(channelName) {
  if (window.queueSocketManager) {
    window.queueSocketManager.switchToChannel(channelName);
  }
}

// Legacy utility functions
function getSessionId() {
  return window.getSessionId ? window.getSessionId() : null;
}

function escapeHtml(text) {
  if (window.queueUIHelpers) {
    return window.queueUIHelpers.escapeHtml(text);
  }
  
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Export legacy globals for backward compatibility
window.QueueAPI = QueueAPI;
window.broadcastQueueOperation = broadcastQueueOperation;
window.showRealtimeNotification = showRealtimeNotification;
window.switchToChannel = switchToChannel;
window.escapeHtml = escapeHtml;
window.reRenderQueues = reRenderQueues;
window.rebuildQueueItems = rebuildQueueItems;
