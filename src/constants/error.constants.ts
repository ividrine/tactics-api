// Errors
export const SERVER_ERROR = "Internal Server Error";

// Validation Errors

export const EMAIL_REQUIRED_ERROR = "Email is required";
export const EMAIL_INVALID_ERROR = "Invalid email";

export const USERNAME_REQUIRED_ERROR = "Username is required";
export const USERNAME_MIN_LEN_ERROR = "Username is not long enough";
export const USERNAME_MAX_LEN_ERROR = "Username is too long";
export const USERNAME_PATTERN_ERROR =
  "Username can only contain letters (a-z, A-Z), numbers (0-9), underscores (_), and hyphens (-)";

export const PW_PATTERN_ERROR =
  "Password must contain at least 1 letter and 1 number";
export const PW_LENGTH_ERROR = "Password must be at least 8 characters";
export const PW_REQUIRED_ERROR = "Password is required";

export const INVALID_TOKEN_ERROR = "Invalid token";

export const INVALID_LOGIN_ERROR = "Incorrect username or password";
