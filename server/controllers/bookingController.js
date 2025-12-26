import Booking from '../models/Booking.js';
import Psychologist from '../models/Psychologist.js';
import emailCalendarService from '../services/emailCalendarService.js';
import zoomService from '../services/zoomService.js';
import stripe from '../config/stripe.js';
import { updateCompletedSessions } from '../utils/sessionCompletionService.js';
import { formatDateOnly, formatShortDate, formatTime24to12 } from '../utils/timezone.js';

// Get all bookings for a psychologist
export const getPsychologistBookings = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    const { status, startDate, endDate } = req.query;

    const psychologist = await Psychologist.findById(psychologistId);
    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psychologist not found'
      });
    }

    if (psychologist.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    await updateCompletedSessions();

    const query = { psychologistId };

    if (status) {
      query.status = status;
    }

    if (startDate && endDate) {
      query.appointmentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const bookings = await Booking.find(query)
      .sort({ appointmentDate: 1, startTime: 1 });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Error in getPsychologistBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const psychologist = await Psychologist.findById(booking.psychologistId);
    const isPsychologist = psychologist && psychologist.userId === req.user.uid;

    if (!isPsychologist) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this booking'
      });
    }

    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${booking.status} booking`
      });
    }

    booking.status = 'cancelled';
    booking.cancellationReason = reason || '';
    booking.cancelledBy = 'psychologist';
    booking.cancelledAt = new Date();

    // Process refund if payment was made
    let refundResult = null;
    if (booking.paymentStatus === 'paid' && booking.stripePaymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);
        const chargeId = paymentIntent.latest_charge;
        
        const charge = await stripe.charges.retrieve(chargeId, {
          expand: ['balance_transaction']
        });
        
        const balanceTx = charge.balance_transaction;
        const originalAmountCents = charge.amount; 
        const originalCurrency = charge.currency;
        
        const feePercentage = balanceTx.fee / balanceTx.amount;
        
        const refundAmountCents = Math.round(originalAmountCents * (1 - feePercentage));
        const feeAmountCents = originalAmountCents - refundAmountCents;
        
        console.log(`Original: ${originalAmountCents/100} ${originalCurrency.toUpperCase()}, Fee %: ${(feePercentage * 100).toFixed(2)}%, Refund: ${refundAmountCents/100} ${originalCurrency.toUpperCase()}`);
        
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          amount: refundAmountCents,
          metadata: {
            bookingId: bookingId.toString(),
            reason: reason || 'Session cancelled by psychologist',
            cancelledBy: 'psychologist',
            originalAmount: (originalAmountCents / 100).toString(),
            feeDeducted: (feeAmountCents / 100).toString(),
            currency: originalCurrency.toUpperCase()
          }
        });

        booking.paymentStatus = 'refunded';
        booking.stripeRefundId = refund.id;
        booking.refundedAt = new Date();
        booking.refundAmount = refundAmountCents / 100;
        refundResult = {
          id: refund.id,
          amount: refundAmountCents / 100,
          originalAmount: originalAmountCents / 100,
          feeDeducted: feeAmountCents / 100,
          currency: originalCurrency.toUpperCase(),
          status: refund.status
        };
        console.log(`Refund processed: ${refund.id}, Amount: ${refundAmountCents/100} ${originalCurrency.toUpperCase()}`);
      } catch (refundError) {
        console.error('Failed to process refund:', refundError.message);
     
      }
    }

    await booking.save();

    // Delete Zoom meeting if exists
    if (booking.zoomMeetingId) {
      try {
        const isZoomAvailable = await zoomService.isAvailable();
        if (isZoomAvailable) {
          await zoomService.deleteMeeting(booking.zoomMeetingId);
          console.log(`Zoom meeting ${booking.zoomMeetingId} deleted for cancelled booking ${bookingId}`);
        }
      } catch (zoomError) {
        console.error('Failed to delete Zoom meeting:', zoomError.message);
      }
    }

    if (emailCalendarService.isAvailable()) {
      try {
        const userEmail = booking.userEmail || '';
        const recipients = [psychologist.email, userEmail].filter(Boolean);

        if (recipients.length > 0) {
          const formattedDate = formatDateOnly(booking.appointmentDate);
          const shortDate = formatShortDate(booking.appointmentDate);
          const formattedStartTime = formatTime24to12(booking.startTime);
          
          const appointmentDateTimeForEmail = new Date(booking.appointmentDate);
          const [cancelHours, cancelMinutes] = booking.startTime.split(':').map(Number);
          appointmentDateTimeForEmail.setHours(cancelHours, cancelMinutes, 0, 0);

          await emailCalendarService.sendCancellationEmail({
            to: recipients,
            subject: `Therapy Session Cancelled - ${shortDate} at ${formattedStartTime} EST`,
            eventTitle: `Psychology Session with ${psychologist.name}`,
            startTime: appointmentDateTimeForEmail,
            reason: reason,
            canceledBy: 'psychologist',
            canceledByName: psychologist.name,
            formattedDate: formattedDate,
            formattedTime: formattedStartTime
          });

          console.log(`Cancellation emails sent to: ${recipients.join(', ')}`);
        }
      } catch (emailError) {
        console.error('Failed to send cancellation emails:', emailError.message);
      }
    }

    res.json({
      success: true,
      message: booking.stripeRefundId 
        ? 'Booking cancelled and payment refunded successfully' 
        : 'Booking cancelled successfully',
      data: booking,
      refund: refundResult
    });
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const psychologist = await Psychologist.findById(booking.psychologistId);
    if (!psychologist || psychologist.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to confirm this booking'
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending bookings can be confirmed'
      });
    }

    booking.status = 'confirmed';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error in confirmBooking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm booking',
      error: error.message
    });
  }
};
