import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Resume from '../models/Resume.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all jobs (with dynamic time-lock filters & query searches)
// @route   GET /api/jobs
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const search = req.query.search || '';
    const location = req.query.location || 'Any';

    let query = {};

    // For recruiters, only show their own postings in their view
    if (req.user.role === 'recruiter') {
      query.recruiterId = req.user._id;
    }

    // Apply search filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location !== 'Any') {
      query.location = { $regex: location, $options: 'i' };
    }

    // Fetch and sort newest first
    const jobs = await Job.find(query).sort({ createdAt: -1 });

    // Client-side mapping is handled, but we inject locked tags contextually
    const parsedJobs = jobs.map(job => {
      const lockDuration = job.lockDuration || 20;
      const unlockTime = new Date(job.createdAt).getTime() + (lockDuration * 60000);
      const timeNow = Date.now();
      const remaining = Math.ceil((unlockTime - timeNow) / 60000);

      let isLocked = false;
      if (
        req.user.role === 'student' &&
        !req.user.isVerified &&
        timeNow < unlockTime
      ) {
        isLocked = true;
      }

      return {
        id: job._id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.type,
        requirements: job.requirements,
        rawRequirements: job.rawRequirements,
        recruiterId: job.recruiterId,
        lockDuration: job.lockDuration,
        description: job.description,
        views: job.views,
        createdAt: job.createdAt,
        isLocked,
        lockRemainingMinutes: isLocked ? remaining : 0
      };
    });

    res.json({ success: true, jobs: parsedJobs });
  } catch (error) {
    console.error('Fetch jobs error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Post a new job opportunity
// @route   POST /api/jobs
// @access  Private (Recruiter only)
router.post('/', protect, async (req, res) => {
  const { title, company, location, type, requirementsText, description } = req.body;

  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ success: false, message: 'Only recruiters can post jobs' });
  }

  if (!title) {
    return res.status(400).json({ success: false, message: 'Job title is required' });
  }

  try {
    // Process requirements text into bullets
    let formattedRequirements = '';
    if (requirementsText && requirementsText.trim()) {
      const requirementsList = requirementsText
        .split('\n')
        .map(line => {
          line = line.trim();
          line = line.replace(/^[•\-*\d.]+\s*/, '');
          return line;
        })
        .filter(line => line.length > 0);

      if (requirementsList.length > 0) {
        formattedRequirements = requirementsList
          .map(req => `• ${req}`)
          .join('<br>');
      }
    }

    const job = await Job.create({
      title,
      company: company || req.user.company || 'Not Specified',
      location: location || 'Remote',
      type: type || 'Full Time',
      requirements: formattedRequirements,
      rawRequirements: requirementsText || '',
      recruiterId: req.user._id,
      description: description || 'New opportunity posted.',
      lockDuration: 20
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a job posting & purge related applications
// @route   DELETE /api/jobs/:id
// @access  Private (Owner recruiter only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job post not found' });
    }

    if (job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You did not post this job.' });
    }

    await Job.findByIdAndDelete(req.params.id);

    // Purge related applications
    await Application.deleteMany({ jobId: req.params.id });

    res.json({ success: true, message: 'Job posting deleted and cleaned successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Increment unique view tracking count atomically
// @route   POST /api/jobs/:id/view
// @access  Private
router.post('/:id/view', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // If user has already viewed, skip
    if (job.viewedBy.includes(req.user._id)) {
      return res.json({ success: true, views: job.views, message: 'Already viewed by user' });
    }

    // Atomically push viewedBy and increment count
    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      {
        $addToSet: { viewedBy: req.user._id },
        $inc: { views: 1 }
      },
      { new: true }
    );

    res.json({ success: true, views: updatedJob.views });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Private (Student only)
router.post('/:id/apply', protect, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can apply for opportunities' });
  }

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    // Check if user already applied
    const alreadyApplied = await Application.findOne({ jobId: req.params.id, studentId: req.user._id });
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: 'You have already applied for this role' });
    }

    // Check if resume exists
    const resume = await Resume.findOne({ userId: req.user._id });

    const application = await Application.create({
      jobId: job._id,
      jobTitle: job.title,
      company: job.company,
      studentId: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      hasResume: !!resume,
      resumeFileName: resume ? resume.fileName : null,
      status: 'pending'
    });

    // Automatically trigger view increment on apply
    if (!job.viewedBy.includes(req.user._id)) {
      await Job.findByIdAndUpdate(req.params.id, {
        $addToSet: { viewedBy: req.user._id },
        $inc: { views: 1 }
      });
    }

    res.status(201).json({ success: true, application });
  } catch (error) {
    console.error('Job application error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all applications submitted by candidate
// @route   GET /api/jobs/applications/me
// @access  Private (Student only)
router.get('/applications/me', protect, async (req, res) => {
  try {
    const applications = await Application.find({ studentId: req.user._id }).sort({ appliedAt: -1 });
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    View all applicants for a posted job
// @route   GET /api/jobs/:id/applicants
// @access  Private (Job owner recruiter only)
router.get('/:id/applicants', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    if (job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to view these applicants' });
    }

    const applicants = await Application.find({ jobId: req.params.id }).sort({ appliedAt: -1 });
    res.json({ success: true, applicants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update application status (Keep/Remove shortlist/reject)
// @route   PUT /api/jobs/applications/:id
// @access  Private (Recruiter only)
router.put('/applications/:id', protect, async (req, res) => {
  const { status } = req.body;

  if (!['shortlisted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid shortlist status' });
  }

  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Job application not found' });
    }

    const job = await Job.findById(application.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Associated job post not found' });
    }

    if (job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You did not post this job.' });
    }

    application.status = status;
    await application.save();

    res.json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
