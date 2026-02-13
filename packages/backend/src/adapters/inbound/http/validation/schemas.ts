import { z } from 'zod';

/**
 * Reusable schema for payment method sub-object
 */
const paymentMethodSchema = z.object({
  type: z.string().min(1, 'paymentMethod.type is required'),
  token: z.string().optional(),
});

/**
 * Reusable schema for optional notification channel
 */
const notificationChannelSchema = z.enum(['EMAIL', 'SMS']).optional();

/**
 * Reusable ISO 8601 date string validation
 * Accepts any string that parses as a valid date
 */
const isoDateStringSchema = z
  .string()
  .min(1)
  .refine((val) => !isNaN(new Date(val).getTime()), {
    message: 'Invalid date format. Use ISO 8601 format.',
  });

// ---------------------------------------------------------------------------
// Rental schemas
// ---------------------------------------------------------------------------

export const createRentalSchema = z
  .object({
    equipmentId: z.string().min(1, 'equipmentId is required'),
    memberId: z.string().min(1, 'memberId is required'),
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    paymentMethod: paymentMethodSchema,
    notificationChannel: notificationChannelSchema,
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const returnRentalSchema = z.object({
  conditionAtReturn: z.string().min(1, 'conditionAtReturn is required'),
  returnDate: isoDateStringSchema.optional(),
  paymentMethod: paymentMethodSchema.optional(),
  notificationChannel: notificationChannelSchema,
});

export const extendRentalSchema = z.object({
  additionalDays: z
    .number({ error: 'additionalDays must be a number' })
    .int()
    .positive('additionalDays must be a positive number'),
  paymentMethod: paymentMethodSchema,
  notificationChannel: notificationChannelSchema,
});

// ---------------------------------------------------------------------------
// Reservation schemas
// ---------------------------------------------------------------------------

export const createReservationSchema = z
  .object({
    equipmentId: z.string().min(1, 'equipmentId is required'),
    memberId: z.string().min(1, 'memberId is required'),
    startDate: isoDateStringSchema,
    endDate: isoDateStringSchema,
    paymentMethod: paymentMethodSchema.optional(),
    authorizePayment: z.boolean().optional(),
    notificationChannel: notificationChannelSchema,
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const cancelReservationSchema = z.object({
  reason: z.string().optional(),
  authorizationId: z.string().optional(),
  notificationChannel: notificationChannelSchema,
});

export const confirmReservationSchema = z.object({
  notificationChannel: notificationChannelSchema,
});

export const fulfillReservationSchema = z.object({
  paymentMethod: paymentMethodSchema,
  authorizationId: z.string().optional(),
  notificationChannel: notificationChannelSchema,
});

// ---------------------------------------------------------------------------
// Inferred request types (usable in place of the manual DTOs for validation)
// ---------------------------------------------------------------------------

export type CreateRentalInput = z.infer<typeof createRentalSchema>;
export type ReturnRentalInput = z.infer<typeof returnRentalSchema>;
export type ExtendRentalInput = z.infer<typeof extendRentalSchema>;

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;
export type ConfirmReservationInput = z.infer<typeof confirmReservationSchema>;
export type FulfillReservationInput = z.infer<typeof fulfillReservationSchema>;
