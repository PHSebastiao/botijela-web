/**
 * Input validation utilities
 */

/**
 * Sanitize string input by trimming whitespace and removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Sanitized string
 */
export const sanitizeString = (input, maxLength = 255) => {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove basic HTML brackets
};

/**
 * Validate queue name
 * @param {string} queueName - Queue name to validate
 * @returns {object} - { isValid: boolean, error?: string }
 */
export const validateQueueName = (queueName) => {
  if (!queueName || typeof queueName !== 'string') {
    return { isValid: false, error: 'Queue name is required' };
  }
  
  const sanitized = sanitizeString(queueName, 40);
  
  if (sanitized.length < 1) {
    return { isValid: false, error: 'Queue name cannot be empty' };
  }
  
  if (sanitized.length > 40) {
    return { isValid: false, error: 'Queue name cannot exceed 40 characters' };
  }
  
  // Allow alphanumeric, spaces, hyphens, underscores
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(sanitized)) {
    return { isValid: false, error: 'Queue name contains invalid characters' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate queue description
 * @param {string} queueDescription - Queue description to validate
 * @returns {object} - { isValid: boolean, error?: string, sanitized: string }
 */
export const validateQueueDescription = (queueDescription) => {
  // Description is optional
  if (!queueDescription) {
    return { isValid: true, sanitized: '' };
  }
  
  if (typeof queueDescription !== 'string') {
    return { isValid: false, error: 'Queue description must be a string' };
  }
  
  const sanitized = sanitizeString(queueDescription, 50);
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Queue description cannot exceed 500 characters' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate queue separator
 * @param {string} queueSeparator - Queue separator to validate
 * @returns {object} - { isValid: boolean, error?: string, sanitized: string }
 */
export const validateQueueSeparator = (queueSeparator) => {
  if (!queueSeparator) {
    return { isValid: true, sanitized: '/' }; // Default separator
  }
  
  if (typeof queueSeparator !== 'string') {
    return { isValid: false, error: 'Queue separator must be a string' };
  }
  
  const sanitized = queueSeparator.trim();
  
  if (sanitized.length > 3) {
    return { isValid: false, error: 'Queue separator must have up to 3 characters' };
  }
  
  return { isValid: true, sanitized };
};

/**
 * Validate boolean checkbox input
 * @param {any} input - Input to validate as boolean
 * @returns {boolean} - Sanitized boolean value
 */
export const validateBoolean = (input) => {
  return input === 'on' || input === true || input === 'true';
};

/**
 * Validate queue creation data
 * @param {object} data - Data to validate
 * @returns {object} - { isValid: boolean, errors: string[], sanitized?: object }
 */
export const validateQueueData = (data) => {
  const errors = [];
  const sanitized = {};
  
  // Validate queue name
  const nameValidation = validateQueueName(data.queueName);
  if (!nameValidation.isValid) {
    errors.push(nameValidation.error);
  } else {
    sanitized.queueName = nameValidation.sanitized;
  }
  
  // Validate queue description
  const descValidation = validateQueueDescription(data.queueDescription);
  if (!descValidation.isValid) {
    errors.push(descValidation.error);
  } else {
    sanitized.queueDescription = descValidation.sanitized;
  }
  
  // Validate queue separator
  const sepValidation = validateQueueSeparator(data.queueSeparator);
  if (!sepValidation.isValid) {
    errors.push(sepValidation.error);
  } else {
    sanitized.queueSeparator = sepValidation.sanitized;
  }
  
  // Validate silent actions
  sanitized.silentActions = validateBoolean(data.silentActions);
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null
  };
};
