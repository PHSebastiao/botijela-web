/**
 * Toast utility for managing multiple toast messages
 */

/**
 * Add a toast message to the session
 * @param {object} req - Express request object
 * @param {string} type - Toast type ('success', 'danger', 'warning', 'info')
 * @param {string} message - Toast message
 */
export const addToast = (req, type, message) => {
  if (!req.session.toasts) {
    req.session.toasts = [];
  }
  
  req.session.toasts.push({
    type,
    message,
    id: Date.now() + Math.random() // Simple unique ID
  });
};

/**
 * Add multiple toast messages to the session
 * @param {object} req - Express request object
 * @param {string} type - Toast type ('success', 'danger', 'warning', 'info')
 * @param {string[]} messages - Array of toast messages
 */
export const addToasts = (req, type, messages) => {
  if (!Array.isArray(messages)) {
    messages = [messages];
  }
  
  messages.forEach(message => {
    addToast(req, type, message);
  });
};

/**
 * Get and clear all toasts from the session
 * @param {object} req - Express request object
 * @returns {object[]} Array of toast objects
 */
export const getAndClearToasts = (req) => {
  const toasts = req.session.toasts || [];
  delete req.session.toasts;
  return toasts;
};

/**
 * Add validation error toasts
 * @param {object} req - Express request object
 * @param {string[]} errors - Array of validation errors
 */
export const addValidationErrors = (req, errors) => {
  addToasts(req, 'danger', errors);
};

/**
 * Add success toast
 * @param {object} req - Express request object
 * @param {string} message - Success message
 */
export const addSuccess = (req, message) => {
  addToast(req, 'success', message);
};

/**
 * Add error toast
 * @param {object} req - Express request object
 * @param {string} message - Error message
 */
export const addError = (req, message) => {
  addToast(req, 'danger', message);
};

/**
 * Add warning toast
 * @param {object} req - Express request object
 * @param {string} message - Warning message
 */
export const addWarning = (req, message) => {
  addToast(req, 'warning', message);
};

/**
 * Add info toast
 * @param {object} req - Express request object
 * @param {string} message - Info message
 */
export const addInfo = (req, message) => {
  addToast(req, 'info', message);
};
