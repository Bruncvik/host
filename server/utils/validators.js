/**
 * Enhanced Validation Module
 * Provides comprehensive input validation with sanitization
 */

import { EMAIL, PASSWORD, HABIT, STATUSES } from "../constants.js";

/**
 * Validate and sanitize email
 * @param {string} email - Email to validate
 * @returns {Object} { isValid: boolean, error?: string, sanitized?: string }
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required and must be a string" };
  }

  const sanitized = String(email).trim().toLowerCase();
  if (!sanitized) {
    return { isValid: false, error: "Email cannot be empty" };
  }

  if (sanitized.length > 254) {
    return { isValid: false, error: "Email exceeds maximum length (254 characters)" };
  }

  if (!EMAIL.REGEX.test(sanitized)) {
    return { isValid: false, error: "Invalid email format" };
  }

  return { isValid: true, sanitized };
}

/**
 * Validate password format and length
 * @param {string} password - Password to validate
 * @returns {Object} { isValid: boolean, error?: string }
 */
export function validatePassword(password) {
  if (!password || typeof password !== "string") {
    return { isValid: false, error: "Password is required and must be a string" };
  }

  if (password.length === 0) {
    return { isValid: false, error: "Password cannot be empty" };
  }

  if (password.length > PASSWORD.MAX_LENGTH) {
    return { isValid: false, error: `Password must be at most ${PASSWORD.MAX_LENGTH} characters` };
  }

  return { isValid: true };
}

/**
 * Validate text with length constraints and sanitization
 * @param {string} text - Text to validate
 * @param {string} fieldName - Field name for error messages
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {Object} { isValid: boolean, error?: string, sanitized?: string }
 */
export function validateAndSanitizeText(text, fieldName, minLength, maxLength) {
  if (typeof text !== "string") {
    return { isValid: false, error: `${fieldName} must be a string` };
  }

  const sanitized = String(text).trim();

  if (sanitized.length === 0) {
    return { isValid: false, error: `${fieldName} cannot be empty` };
  }

  if (sanitized.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }

  if (sanitized.length > maxLength) {
    return { isValid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }

  return { isValid: true, sanitized };
}

/**
 * Validate text length within bounds (legacy method for backwards compatibility)
 * @param {string} value - Text to validate
 * @param {string} fieldName - Name of field for error messages
 * @param {number} min - Minimum length (inclusive)
 * @param {number} max - Maximum length (inclusive)
 * @returns {string|null} - Error message or null if valid
 */
export function validateTextLength(value, fieldName, min, max) {
  if (typeof value !== "string") return `${fieldName} must be a string`;
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    return `${fieldName} length must be between ${min} and ${max} characters`;
  }
  return null;
}

/**
 * Validate habit name with sanitization
 * @param {string} name - Habit name to validate
 * @returns {Object} { isValid: boolean, error?: string, sanitized?: string }
 */
export function validateHabitName(name) {
  return validateAndSanitizeText(
    name,
    "Habit name",
    HABIT.NAME_MIN_LENGTH,
    HABIT.NAME_MAX_LENGTH
  );
}

/**
 * Validate habit frequency with sanitization
 * @param {string} frequency - Frequency to validate
 * @returns {Object} { isValid: boolean, error?: string, sanitized?: string }
 */
export function validateHabitFrequency(frequency) {
  return validateAndSanitizeText(
    frequency,
    "Frequency",
    HABIT.FREQUENCY_MIN_LENGTH,
    HABIT.FREQUENCY_MAX_LENGTH
  );
}

/**
 * Validate reminder time format (HH:MM)
 * @param {string} time - Time string to validate
 * @returns {Object} { isValid: boolean, error?: string, sanitized?: string }
 */
export function validateReminderTime(time) {
  if (!time || typeof time !== "string") {
    return { isValid: false, error: "Time is required and must be a string" };
  }

  const sanitized = String(time).trim();
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (!timeRegex.test(sanitized)) {
    return { isValid: false, error: "Time must be in HH:MM format (00:00 - 23:59)" };
  }

  return { isValid: true, sanitized };
}

/**
 * Validate category name with sanitization
 * @param {string} name - Category name to validate
 * @returns {Object} { isValid: boolean, error?: string, sanitized?: string }
 */
export function validateCategoryName(name) {
  return validateAndSanitizeText(
    name,
    "Category name",
    2,  // min
    50   // max
  );
}

/**
 * Validate habit day status
 * @param {string} status - Status to validate
 * @returns {Object} { isValid: boolean, error?: string, sanitized?: string }
 */
export function validateHabitDayStatus(status) {
  if (!status || typeof status !== "string") {
    return { isValid: false, error: "Status is required and must be a string" };
  }

  const normalizedStatus = String(status).trim().toLowerCase();

  if (!STATUSES.HABIT_DAY.includes(normalizedStatus)) {
    return {
      isValid: false,
      error: `Status must be one of: ${STATUSES.HABIT_DAY.join(", ")}`,
    };
  }

  return { isValid: true, sanitized: normalizedStatus };
}

/**
 * Validate numeric ID parameter
 * @param {string|number} id - ID to validate
 * @param {string} paramName - Parameter name for error messages
 * @returns {Object} { isValid: boolean, error?: string, parsed?: number }
 */
export function validateNumericId(id, paramName = "ID") {
  if (id === undefined || id === null || id === "") {
    return { isValid: false, error: `${paramName} is required` };
  }

  const normalized = typeof id === "number" ? String(id) : String(id).trim();
  if (!/^[1-9]\d*$/.test(normalized)) {
    return { isValid: false, error: `${paramName} must be a positive integer` };
  }

  const parsed = Number(normalized);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { isValid: false, error: `${paramName} must be a positive integer` };
  }

  return { isValid: true, parsed };
}

/**
 * Sanitize object by trimming all string fields
 * @param {Object} obj - Object to sanitize
 * @returns {Object} - New object with trimmed strings
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = String(value).trim();
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Check if value looks like a bcrypt hash
 * @param {string} value - Value to check
 * @returns {boolean}
 */
export function looksLikeBcryptHash(value) {
  return typeof value === "string" && value.startsWith("$2") && value.length >= 59;
}
