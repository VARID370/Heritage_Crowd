const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name cannot exceed 100 characters'),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().optional(),
  phone: z.string().trim().optional(),
}).refine(
  (data) => !data.confirmPassword || data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
);

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

const resendVerificationSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
});

const bookingCreateSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  visitorCount: z.number().int().min(1, 'At least 1 visitor is required').max(10, 'Maximum 10 visitors allowed'),
  visitorName: z.string().min(2, 'Primary visitor name is required'),
  visitorEmail: z.string().email('Valid visitor email is required'),
  visitorPhone: z.string().optional(),
});

const verificationSchema = z.object({
  token: z.string().optional(),
  bookingReference: z.string().optional(),
  method: z.enum(['qr_scan', 'manual']).default('qr_scan'),
}).refine(data => data.token || data.bookingReference, {
  message: 'Either verification token or booking reference must be provided',
});

const configureSiteSchema = z.object({
  osmId: z.string().min(1, 'OSM identifier is required'),
  name: z.string().min(1, 'Site name is required'),
  city: z.string().optional().default(''),
  state: z.string().optional().default(''),
  category: z.enum(['fort', 'palace', 'monument', 'archaeological_site', 'historic', 'temple_heritage', 'other']).default('monument'),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  imageUrl: z.string().optional().default(''),
  imageAttribution: z.string().optional().default(''),
  description: z.string().optional().default(''),
  entryFee: z.number().min(0, 'Entry fee cannot be negative'),
  isActive: z.boolean().default(true),
  crowdCapacityPerSlot: z.number().int().min(1).default(150),
  openingHours: z.string().optional().default('09:00 AM - 05:30 PM'),
});

const createSlotSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be HH:mm (e.g. 09:00)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be HH:mm (e.g. 12:00)'),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  verifyOtpSchema,
  resendVerificationSchema,
  bookingCreateSchema,
  verificationSchema,
  configureSiteSchema,
  createSlotSchema,
};

