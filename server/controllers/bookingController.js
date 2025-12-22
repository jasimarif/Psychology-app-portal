import Booking from '../models/Booking.js';
import Psychologist from '../models/Psychologist.js';

// Get all bookings for a psychologist
export const getPsychologistBookings = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    const { status, startDate, endDate } = req.query;

    // Verify psychologist owns this profile
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

    // Build query
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

// Cancel a booking (psychologist)
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

    // Check if psychologist is authorized to cancel
    const psychologist = await Psychologist.findById(booking.psychologistId);
    const isPsychologist = psychologist && psychologist.userId === req.user.uid;

    if (!isPsychologist) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to cancel this booking'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel a ${booking.status} booking`
      });
    }

    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = reason || '';
    booking.cancelledBy = 'psychologist';
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
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

// Confirm a booking (psychologist only)
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

    // Verify psychologist owns this booking
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
