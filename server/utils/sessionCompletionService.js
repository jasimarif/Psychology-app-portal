import Booking from '../models/Booking.js';


export const updateCompletedSessions = async () => {
  try {
    const now = new Date();

    const bookings = await Booking.find({
      status: 'confirmed'
    });

    let updatedCount = 0;

    for (const booking of bookings) {
      const appointmentDate = new Date(booking.appointmentDate);
      const [hours, minutes] = booking.endTime.split(':').map(Number);

      const endDateTime = new Date(appointmentDate);
      endDateTime.setHours(hours, minutes, 0, 0);

      if (endDateTime < now) {
        booking.status = 'completed';
        await booking.save();
        updatedCount++;
        console.log(`Booking ${booking._id} marked as completed`);
      }
    }

    if (updatedCount > 0) {
      console.log(`Session completion check: ${updatedCount} booking(s) marked as completed`);
    }

    return {
      success: true,
      updatedCount
    };
  } catch (error) {
    console.error('Error in updateCompletedSessions:', error);
    return {
      success: false,
      error: error.message
    };
  }
};


export const checkAndCompleteBooking = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return {
        success: false,
        message: 'Booking not found'
      };
    }

    if (booking.status !== 'confirmed') {
      return {
        success: false,
        message: `Booking is already ${booking.status}`
      };
    }

    const now = new Date();
    const appointmentDate = new Date(booking.appointmentDate);
    const [hours, minutes] = booking.endTime.split(':').map(Number);

    const endDateTime = new Date(appointmentDate);
    endDateTime.setHours(hours, minutes, 0, 0);

    if (endDateTime < now) {
      booking.status = 'completed';
      await booking.save();

      return {
        success: true,
        message: 'Booking marked as completed',
        data: booking
      };
    }

    return {
      success: false,
      message: 'Session has not ended yet'
    };
  } catch (error) {
    console.error('Error in checkAndCompleteBooking:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
