import Psychologist from '../models/Psychologist.js';
import { cloudinary } from '../config/cloudinary.js';


export const createProfile = async (req, res) => {
  try {
    const {
      userId,
      name,
      title,
      email,
      phone,
      location,
      experience,
      bio,
      price,
      gender,
      languages,
      specialties,
      education,
      workExperience,
      licenseNumber,
      // typicalHours
    } = req.body;

    console.log('Create profile request body:', req.body);
    console.log('Languages received:', languages);

    const existingProfile = await Psychologist.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({ 
        success: false,
        message: 'Profile already exists for this user' 
      });
    }

    const parsedLanguages = languages && languages !== '' 
      ? (typeof languages === 'string' ? JSON.parse(languages) : languages)
      : [];
    
    const parsedSpecialties = specialties && specialties !== '' 
      ? (typeof specialties === 'string' ? JSON.parse(specialties) : specialties)
      : [];
    
    const parsedEducation = education && education !== '' 
      ? (typeof education === 'string' ? JSON.parse(education) : education)
      : [];
    
    const parsedWorkExperience = workExperience && workExperience !== '' 
      ? (typeof workExperience === 'string' ? JSON.parse(workExperience) : workExperience)
      : [];

    const profileData = {
      userId,
      name,
      title,
      email,
      phone,
      location,
      experience,
      bio,
      price,
      gender,
      languages: parsedLanguages,
      specialties: parsedSpecialties,
      education: parsedEducation,
      workExperience: parsedWorkExperience,
      licenseNumber,
      // typicalHours,
      profileImage: req.file ? req.file.path : null
    };

    console.log('Profile data to save:', profileData);

    const psychologist = await Psychologist.create(profileData);

    res.status(201).json({
      success: true,
      message: 'Profile created successfully',
      data: psychologist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating profile',
      error: error.message
    });
  }
};


export const getProfileByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const psychologist = await Psychologist.findOne({ userId });

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: psychologist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      name,
      title,
      email,
      phone,
      location,
      experience,
      bio,
      price,
      gender,
      languages,
      specialties,
      education,
      workExperience,
      licenseNumber,
      // typicalHours,
      availability,
      deleteProfileImage
    } = req.body;


    const psychologist = await Psychologist.findOne({ userId });

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const parsedLanguages = languages && languages !== ''
      ? (typeof languages === 'string' ? JSON.parse(languages) : languages)
      : psychologist.languages;

    const parsedSpecialties = specialties && specialties !== ''
      ? (typeof specialties === 'string' ? JSON.parse(specialties) : specialties)
      : psychologist.specialties;

    const parsedEducation = education && education !== ''
      ? (typeof education === 'string' ? JSON.parse(education) : education)
      : psychologist.education;

    const parsedWorkExperience = workExperience && workExperience !== ''
      ? (typeof workExperience === 'string' ? JSON.parse(workExperience) : workExperience)
      : psychologist.workExperience;

    console.log('Parsed languages:', parsedLanguages);

    // Handle profile image deletion if requested
    if (deleteProfileImage === 'true' && psychologist.profileImage) {
      console.log('Deleting profile image from Cloudinary:', psychologist.profileImage);
      const urlParts = psychologist.profileImage.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `psychologist-profiles/${publicIdWithExtension.split('.')[0]}`;

      try {
        await cloudinary.uploader.destroy(publicId);
        console.log('Profile image deleted successfully');
        psychologist.profileImage = null; // Remove image URL from database
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    // If uploading a new image, delete the old one first
    if (req.file && psychologist.profileImage) {
      console.log('Deleting old image from Cloudinary:', psychologist.profileImage);
      const urlParts = psychologist.profileImage.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `psychologist-profiles/${publicIdWithExtension.split('.')[0]}`;

      try {
        await cloudinary.uploader.destroy(publicId);
        console.log('Old image deleted successfully');
      } catch (error) {
        console.error('Error deleting old image from Cloudinary:', error);
      }
    }

    psychologist.name = name || psychologist.name;
    psychologist.title = title || psychologist.title;
    psychologist.email = email || psychologist.email;
    psychologist.phone = phone || psychologist.phone;
    psychologist.location = location || psychologist.location;
    psychologist.experience = experience || psychologist.experience;
    psychologist.bio = bio || psychologist.bio;
    psychologist.price = price || psychologist.price;
    psychologist.gender = gender || psychologist.gender;
    psychologist.languages = parsedLanguages;
    psychologist.specialties = parsedSpecialties;
    psychologist.education = parsedEducation;
    psychologist.workExperience = parsedWorkExperience;
    psychologist.licenseNumber = licenseNumber || psychologist.licenseNumber;
    // psychologist.typicalHours = typicalHours || psychologist.typicalHours;

    // Update availability if provided
    if (availability) {
      const parsedAvailability = typeof availability === 'string'
        ? JSON.parse(availability)
        : availability;
      psychologist.availability = parsedAvailability;
    }

    // Set new profile image if uploaded
    if (req.file) {
      psychologist.profileImage = req.file.path;
    }

    const updatedPsychologist = await psychologist.save();
  

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedPsychologist
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const psychologist = await Psychologist.findOne({ userId });

    if (!psychologist) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    if (psychologist.profileImage) {
      const urlParts = psychologist.profileImage.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = `psychologist-profiles/${publicIdWithExtension.split('.')[0]}`;
      
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    await psychologist.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting profile',
      error: error.message
    });
  }
};
