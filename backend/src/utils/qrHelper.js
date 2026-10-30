const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a unique, secure verification token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(24).toString('hex');
};

/**
 * Generate human-readable reference, e.g. HC-20261029-A7F2
 */
const generateBookingReference = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `HC-${dateStr}-${randomChars}`;
};

/**
 * Format 24-hour time "09:00" to "09:00 AM"
 */
const formatTimeAMPM = (time24) => {
  if (!time24 || typeof time24 !== 'string') return '';
  const [hourStr, minStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
  return `${formattedHour}:${minStr} ${ampm}`;
};

/**
 * Format slot time range, e.g. "09:00", "12:00" -> "09:00 AM - 12:00 PM"
 */
const formatSlotRange = (startTime, endTime) => {
  return `${formatTimeAMPM(startTime)} - ${formatTimeAMPM(endTime)}`;
};

/**
 * Generate QR code as Base64 Data URL for a booking
 */
const generateQRCodeDataURL = async (bookingData) => {
  try {
    const payload = JSON.stringify({
      ref: bookingData.bookingReference,
      tok: bookingData.verificationToken,
      v: 1,
    });
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#1C1917', // Charcoal
        light: '#FFFFFF',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

module.exports = {
  generateVerificationToken,
  generateBookingReference,
  formatTimeAMPM,
  formatSlotRange,
  generateQRCodeDataURL,
};

