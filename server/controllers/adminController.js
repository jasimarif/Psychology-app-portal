import Booking from '../models/Booking.js';
import Psychologist from '../models/Psychologist.js';
import { updateCompletedSessions } from '../utils/sessionCompletionService.js';

// Get all psychologists 
export const getAllPsychologists = async (req, res) => {
  try {
    const psychologists = await Psychologist.find()
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: psychologists,
      count: psychologists.length
    });
  } catch (error) {
    console.error('Error in getAllPsychologists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch psychologists',
      error: error.message
    });
  }
};

// Get all bookings 
export const getAllBookings = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    await updateCompletedSessions();

    const query = {};

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
      .populate('psychologistId', 'name email profileImage title')
      .sort({ appointmentDate: -1, startTime: -1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error in getAllBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get all unique users from bookings 
export const getAllUsers = async (req, res) => {
  try {
    const usersFromBookings = await Booking.aggregate([
      {
        $group: {
          _id: '$userId',
          userEmail: { $first: '$userEmail' },
          userName: { $first: '$userName' },
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalSpent: {
            $sum: {
              $cond: [
                { $in: ['$status', ['confirmed', 'completed']] },
                '$price',
                0
              ]
            }
          },
          firstBooking: { $min: '$createdAt' },
          lastBooking: { $max: '$createdAt' }
        }
      },
      {
        $project: {
          userId: '$_id',
          userEmail: 1,
          userName: 1,
          totalBookings: 1,
          confirmedBookings: 1,
          completedBookings: 1,
          cancelledBookings: 1,
          totalSpent: 1,
          firstBooking: 1,
          lastBooking: 1
        }
      },
      {
        $sort: { lastBooking: -1 }
      }
    ]);

    res.json({
      success: true,
      data: usersFromBookings,
      count: usersFromBookings.length
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Get admin statistics
export const getAdminStats = async (req, res) => {
  try {
    await updateCompletedSessions();

    const psychologistCount = await Psychologist.countDocuments();
    const activePsychologists = await Psychologist.countDocuments({ isActive: true });

    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          confirmed: {
            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                { $in: ['$status', ['confirmed', 'completed']] },
                '$price',
                0
              ]
            }
          }
        }
      }
    ]);

    const uniqueUsers = await Booking.distinct('userId');

    const stats = bookingStats[0] || {
      total: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: 0
    };

    res.json({
      success: true,
      data: {
        psychologists: {
          total: psychologistCount,
          active: activePsychologists
        },
        users: {
          total: uniqueUsers.length
        },
        bookings: {
          total: stats.total,
          confirmed: stats.confirmed,
          completed: stats.completed,
          cancelled: stats.cancelled
        },
        revenue: {
          total: stats.totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Error in getAdminStats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats',
      error: error.message
    });
  }
};

// Get bookings for a specific user 
export const getUserBookings = async (req, res) => {
  try {
    const { userId } = req.params;

    const bookings = await Booking.find({ userId })
      .populate('psychologistId', 'name email profileImage title')
      .sort({ appointmentDate: -1, startTime: -1 });

    res.json({
      success: true,
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings',
      error: error.message
    });
  }
};

// Toggle psychologist active status
export const togglePsychologistStatus = async (req, res) => {
  try {
    const { psychologistId } = req.params;
    const { isActive } = req.body;

    const psychologist = await Psychologist.findByIdAndUpdate(
      psychologistId,
      { isActive: isActive },
      { new: true }
    );

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Psychologist not found'
      });
    }

    res.json({
      success: true,
      message: `Psychologist ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: psychologist
    });
  } catch (error) {
    console.error('Error in togglePsychologistStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update psychologist status',
      error: error.message
    });
  }
};

// Admin login with predefined credentials
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (email === adminEmail && password === adminPassword) {
      res.json({
        success: true,
        message: 'Login successful'
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};