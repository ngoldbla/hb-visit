/**
 * Phone number utilities for E.164 formatting and validation
 */

/**
 * Normalize a phone number input to digits only
 * Accepts +, spaces, dashes, parentheses
 * @param {string|number} input - Raw phone input
 * @returns {string} Digits only string
 */
function extractDigits(input) {
    return String(input ?? '').replace(/\D/g, '')
}

/**
 * Parse phone input and return normalized data
 * @param {string|number} input - Raw phone input (may include +, spaces, etc.)
 * @returns {{ digits: string, hasPlus: boolean, formatted: string|null, valid: boolean, error: string|null }}
 */
function parsePhone(input) {
    const raw = String(input ?? '').trim()
    const hasPlus = raw.startsWith('+')
    const digits = extractDigits(raw)
    
    if (!digits) {
        return { digits: '', hasPlus: false, formatted: null, valid: false, error: 'Mobile number is required.' }
    }
    
    // ITU-T E.164: 7-15 digits (excluding country code leading zeros)
    if (digits.length < 7 || digits.length > 15) {
        return { digits, hasPlus, formatted: null, valid: false, error: 'Mobile number must be 7–15 digits.' }
    }
    
    // Format as E.164: +[digits]
    const formatted = '+' + digits
    
    return { digits, hasPlus, formatted, valid: true, error: null }
}

/**
 * Validate phone number format
 * @param {string|number} input 
 * @returns {boolean}
 */
function isValidPhone(input) {
    return parsePhone(input).valid
}

/**
 * Convert phone to E.164 format for storage
 * @param {string|number} input 
 * @returns {string|null} E.164 formatted string or null if invalid
 */
function toE164(input) {
    const result = parsePhone(input)
    return result.valid ? result.formatted : null
}

/**
 * Format phone for display (simple grouping)
 * @param {string} e164Phone - E.164 formatted phone
 * @returns {string} Display formatted phone
 */
function formatForDisplay(e164Phone) {
    if (!e164Phone) return ''
    // Simple display: keep as-is for now, can add country-specific formatting later
    return e164Phone
}

module.exports = {
    extractDigits,
    parsePhone,
    isValidPhone,
    toE164,
    formatForDisplay
}
