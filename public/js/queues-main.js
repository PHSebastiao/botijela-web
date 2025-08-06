// Main Queue Management Entry Point
// Coordinates all queue-related functionality using modular components

// Cleanup function for page unload
function setupCleanup() {
  $(window).on("beforeunload", function () {    
    // Cleanup socket connections
    if (window.queueSocketManager) {
      window.queueSocketManager.cleanup();
    }
  });
}

// Initialize with session ID helper
function getSessionId() {
  let sessionId = window.socketConfig?.sessionId;
  
  if (!sessionId) {
    sessionId = document.cookie
      .split("; ")
      .find((row) => row.startsWith("connect.sid="))
      ?.split("=")[1];
  }
  
  if (!sessionId) {
    sessionId = "anonymous-" + Math.random().toString(36).substr(2, 9);
  }
  
  return sessionId;
}

// Main initialization function
function initializeQueueManagement() {
  // Setup cleanup handlers
  setupCleanup();
  
  // Initialize UI components
  window.queueUIHelpers.initialize();
  
  // Initialize sortable functionality
  window.queueUIHelpers.initializeSortable();
  
  // Initialize socket connection
  window.queueSocketManager.initialize();
}

// Initialize when DOM is ready
$(function () {
  initializeQueueManagement();
});

// Export getSessionId for other modules
window.getSessionId = getSessionId;
