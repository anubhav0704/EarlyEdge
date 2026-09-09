import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import MockTest from '../models/MockTest.js';
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
  const { name, email, password, role, company, university, stream, branch, phoneNumber } = req.body;

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
      phoneNumber: phoneNumber || '',
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
          phoneNumber: user.phoneNumber,
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

// @desc    Authenticate or Register via Google Auth
// @route   POST /api/auth/google
// @access  Public
router.post('/google', async (req, res) => {
  const { email, name, role, googleId, photoURL, phoneNumber } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ success: false, message: 'Google Auth requires valid email' });
    }

    let user = await User.findOne({ email });

    if (user) {
      // User exists, update googleId / photoURL / phoneNumber if missing
      if (!user.googleId) user.googleId = googleId || `google_${Date.now()}`;
      if (photoURL && !user.photoURL) user.photoURL = photoURL;
      if (phoneNumber && !user.phoneNumber) user.phoneNumber = phoneNumber;
      await user.save();
    } else {
      // Create new user with Google Auth
      const randomPassword = `GAuth_${Math.random().toString(36).slice(-8)}_${Date.now()}`;
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: randomPassword,
        role: role || 'student',
        googleId: googleId || `google_${Date.now()}`,
        photoURL: photoURL || '',
        phoneNumber: phoneNumber || '',
        isVerified: role === 'recruiter'
      });
    }

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        uid: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
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
    console.error('Google Auth error:', error);
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
        phoneNumber: user.phoneNumber || '',
        role: user.role,
        company: user.company,
        university: user.university,
        stream: user.stream,
        branch: user.branch,
        isVerified: user.isVerified,
        tqScore: user.tqScore || 500,
        rank: user.rank || 1,
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
      user.phoneNumber = req.body.phoneNumber !== undefined ? req.body.phoneNumber : user.phoneNumber;
      user.university = req.body.university || user.university;
      user.stream = req.body.stream || user.stream;
      user.branch = req.body.branch || user.branch;
      user.company = req.body.company || user.company;
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
          phoneNumber: updatedUser.phoneNumber || '',
          company: updatedUser.company,
          university: updatedUser.university,
          stream: updatedUser.stream,
          branch: updatedUser.branch,
          isVerified: updatedUser.isVerified,
          tqScore: updatedUser.tqScore || 500,
          rank: updatedUser.rank || 1,
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

    const mockTests = await MockTest.find({ userId: student._id }).sort({ timestamp: -1 });

    res.json({
      success: true,
      user: {
        uid: student._id,
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber || 'N/A',
        role: student.role,
        university: student.university,
        stream: student.stream,
        branch: student.branch,
        isVerified: student.isVerified,
        tqScore: student.tqScore || 500,
        rank: student.rank || 1,
        squadId: student.squadId,
        photoURL: student.photoURL,
        createdAt: student.createdAt,
        mockTests: mockTests
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Request password reset authorization token
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Please provide an email address' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email address' });
    }

    // Generate 6-digit authorization reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set token and expiration (10 minutes)
    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    res.json({
      success: true,
      message: 'Reset authorization code generated successfully',
      resetCode: resetCode
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reset password using authorization code
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res) => {
  const { email, resetCode, newPassword } = req.body;

  if (!email || !resetCode || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordToken: resetCode,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset authorization code' });
    }

    // Update password & clear reset token
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
