import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    default: ''
  },
  userName: {
    type: String,
    default: ''
  },
  psychologistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Psychologist',
    required: true,
    index: true
  },
  appointmentDate: {
    type: Date,
    required: true,
    index: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  timezone: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
    index: true
  },
  price: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  cancellationReason: {
    type: String
  },
  cancelledBy: {
    type: String,
    enum: ['user', 'psychologist', 'system']
  },
  cancelledAt: {
    type: Date
  },
  // Zoom integration fields
  zoomMeetingId: {
    type: String,
    default: null
  },
  zoomJoinUrl: {
    type: String,
    default: null
  },
  zoomPassword: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking
bookingSchema.index(
  { psychologistId: 1, appointmentDate: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'confirmed'] }
    }
  }
);

// Index for efficient queries
bookingSchema.index({ userId: 1, appointmentDate: 1 });
bookingSchema.index({ psychologistId: 1, status: 1 });

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking;
