// Shared constants across server and CLI

export const PASSWORD = {
  MAX_LENGTH: 24,
  MIN_LENGTH: 1,
  REGEX: /^.{1,24}$/,
};

export const EMAIL = {
  REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

export const JWT = {
  EXPIRY: "7d",
  SECRET_DEFAULT: "dev-secret",
};

export const HABIT = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 80,
  FREQUENCY_MIN_LENGTH: 2,
  FREQUENCY_MAX_LENGTH: 30,
};

export const RETENTION = {
  DAYS: 30,
};

export const STATUSES = {
  HABIT_DAY: ["pending", "done", "skipped", "missed"],
};

export const WEEKDAYS = {
  KEYS: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
  ALIASES: {
    sun: ["sun", "sunday", "ned", "nedele"],
    mon: ["mon", "monday", "po", "pon", "pondeli"],
    tue: ["tue", "tues", "tuesday", "ut", "utery"],
    wed: ["wed", "wednesday", "st", "streda"],
    thu: ["thu", "thur", "thurs", "thursday", "ct", "ctvrtek"],
    fri: ["fri", "friday", "pa", "patek"],
    sat: ["sat", "saturday", "so", "sobota"],
  },
};

export const ROLES = {
  USER: "user",
  ADMIN: "admin",
  ALLOWED: ["user", "admin"],
};

export const BCRYPT = {
  SALT_ROUNDS: 10,
};
