import mongoose from 'mongoose';

const psychologistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  location: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
  },
  languages: [{
    type: String
  }],
  specialties: [{
    type: String
  }],
  education: [{
    degree: {
      type: String,
      required: true
    },
    institution: {
      type: String,
      required: true
    },
    year: {
      type: String,
      required: true
    }
  }],
  workExperience: [{
    position: {
      type: String,
      required: true
    },
    organization: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    description: {
      type: String
    }
  }],
  licenseNumber: {
    type: String
  },
  // typicalHours: {
  //   type: String,
  //   required: true
  // },
  availability: {
    timezone: {
      type: String,
      required: false
    },
    sessionDuration: {
      type: Number,
      default: 60
    },
    schedule: [{
      dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
      },
      slots: [{
        startTime: {
          type: String,
          required: true
        },
        endTime: {
          type: String,
          required: true
        },
        isActive: {
          type: Boolean,
          default: true
        }
      }]
    }]
  },
  profileImage: {
    type: String,
    default: null
  },
  rating: {
    type: Number,
    default: 0
  },
  reviews: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Psychologist = mongoose.model('Psychologist', psychologistSchema);

export default Psychologist;
