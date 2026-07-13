import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
router.post('/signup', async (req, res) => {
  const { name, email, password, role, company, university, stream, branch } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already registered with this email' });
    }

    // Create user profile
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      company: role === 'recruiter' ? company : '',
      university: role === 'student' ? university : '',
      stream: role === 'student' ? stream : '',
      branch: role === 'student' ? branch : '',
      isVerified: role === 'recruiter' // Recruiters are auto-verified in our mock
    });

    if (user) {
      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          uid: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          university: user.university,
          stream: user.stream,
          branch: user.branch,
          isVerified: user.isVerified,
          squadId: user.squadId,
          photoURL: user.photoURL
        }
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          uid: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company: user.company,
          university: user.university,
          stream: user.stream,
          branch: user.branch,
          isVerified: user.isVerified,
          squadId: user.squadId,
          photoURL: user.photoURL
        }
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = req.user;
    res.json({
      success: true,
      user: {
        uid: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        university: user.university,
        stream: user.stream,
        branch: user.branch,
        isVerified: user.isVerified,
        squadId: user.squadId,
        photoURL: user.photoURL
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.university = req.body.university !== undefined ? req.body.university : user.university;
      user.stream = req.body.stream !== undefined ? req.body.stream : user.stream;
      user.branch = req.body.branch !== undefined ? req.body.branch : user.branch;
      user.company = req.body.company !== undefined ? req.body.company : user.company;
      user.photoURL = req.body.photoURL !== undefined ? req.body.photoURL : user.photoURL;

      if (req.body.isVerified !== undefined) {
        user.isVerified = req.body.isVerified;
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: {
          uid: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          company: updatedUser.company,
          university: updatedUser.university,
          stream: updatedUser.stream,
          branch: updatedUser.branch,
          isVerified: updatedUser.isVerified,
          squadId: updatedUser.squadId,
          photoURL: updatedUser.photoURL
        }
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update user password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password if user registered with standard email/pass
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get student profile details (for recruiter view)
// @route   GET /api/auth/student/:id
// @access  Private
router.get('/student/:id', protect, async (req, res) => {
  try {
    const student = await User.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    res.json({
      success: true,
      user: {
        uid: student._id,
        name: student.name,
        email: student.email,
        role: student.role,
        university: student.university,
        stream: student.stream,
        branch: student.branch,
        isVerified: student.isVerified,
        squadId: student.squadId,
        photoURL: student.photoURL,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
