export default {
    SUCCESS: `The operation has been successful`,
    SOMETHING_WENT_WRONG: `Something went wrong!`,
    NOT_FOUND: (entity) => `${entity} not found`,
    TOO_MANY_REQUESTS: `Too many requests! Please try again after some time`,
    ALREADY_EXIST: (entity, identifier) => `${entity} already exist with ${identifier}`,
    INVALID_IP: `Invalid IP address`,
    FAILED_TO_SAVE: `Failed to save the data`,
    CUSTOM_MESSAGE: (entity) => `${entity}`,
    UNAUTHORIZED: `You are not authorized to perform this action`,
    INVALID_CREDENTIALS: `Invalid credentials`,

    USER_REGISTERED: 'User registered successfully',
    EMAIL_NOT_VERIFIED: 'Please verify your email first',
    LOGIN_SUCCESS: 'Login successful',
    INVALID_TOKEN: 'Invalid verification token',
    TOKEN_EXPIRED: 'Verification token has expired',
    EMAIL_VERIFIED: 'Email verified successfully',
    ALREADY_VERIFIED: 'Email already verified'
}