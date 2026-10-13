import express from 'express';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Resume from '../models/Resume.js';
import User from '../models/User.js';
import MockTest from '../models/MockTest.js';
import VerificationTest from '../models/VerificationTest.js';
import Interview from '../models/Interview.js';
import PracticeSubmission from '../models/PracticeSubmission.js';
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
        salary: job.salary || '',
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
  const { title, company, location, type, requirementsText, description, salary } = req.body;

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
      salary: salary || '',
      lockDuration: 20
    });

    res.status(201).json({ success: true, job });
  } catch (error) {
    console.error('Post job error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update an existing job posting
// @route   PUT /api/jobs/:id
// @access  Private (Owner recruiter only)
router.put('/:id', protect, async (req, res) => {
  const { title, company, location, type, requirementsText, description, salary } = req.body;

  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job post not found' });
    }

    if (job.recruiterId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You did not post this job.' });
    }

    // Process requirements text into formatted HTML bullets if provided
    if (requirementsText !== undefined) {
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
            .map(reqItem => `• ${reqItem}`)
            .join('<br>');
        }
      }
      job.requirements = formattedRequirements;
      job.rawRequirements = requirementsText;
    }

    if (title) job.title = title.trim();
    if (company !== undefined) job.company = company.trim() || req.user.company || 'Not Specified';
    if (location !== undefined) job.location = location;
    if (type !== undefined) job.type = type;
    if (description !== undefined) job.description = description;
    if (salary !== undefined) job.salary = salary;

    const updatedJob = await job.save();

    res.json({ success: true, job: updatedJob, message: 'Job posting updated successfully' });
  } catch (error) {
    console.error('Update job error:', error);
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

    const applications = await Application.find({ jobId: req.params.id }).sort({ appliedAt: -1 });
    const studentIds = applications.map(app => app.studentId);

    // Fetch user profiles and all performance records in parallel
    const [students, resumes, mockTests, verifications, interviews, practiceSubs] = await Promise.all([
      User.find({ _id: { $in: studentIds } }).select('-password').lean(),
      Resume.find({ userId: { $in: studentIds } }).select('userId fileName fileSize fileType uploadedAt').lean(),
      MockTest.find({ userId: { $in: studentIds } }).select('userId accuracy score total domain partAScore partBScore partCScore timestamp').lean(),
      VerificationTest.find({ userId: { $in: studentIds } }).select('userId passed certificateId score total timestamp').lean(),
      Interview.find({ userId: { $in: studentIds } }).select('userId scores techStack timestamp duration').lean(),
      PracticeSubmission.find({ userId: { $in: studentIds } }).select('userId category difficulty status attemptsCount').lean()
    ]);

    const studentMap = {};
    students.forEach(s => { studentMap[s._id.toString()] = s; });

    const resumeMap = {};
    resumes.forEach(r => { resumeMap[r.userId.toString()] = r; });

    const mockMap = {};
    mockTests.forEach(m => {
      const uid = m.userId.toString();
      if (!mockMap[uid]) mockMap[uid] = [];
      mockMap[uid].push(m);
    });

    const verifyMap = {};
    verifications.forEach(v => {
      const uid = v.userId.toString();
      if (!verifyMap[uid]) verifyMap[uid] = v; // latest
    });

    const interviewMap = {};
    interviews.forEach(i => {
      const uid = i.userId.toString();
      if (!interviewMap[uid]) interviewMap[uid] = [];
      interviewMap[uid].push(i);
    });

    const practiceMap = {};
    practiceSubs.forEach(p => {
      const uid = p.userId.toString();
      if (!practiceMap[uid]) practiceMap[uid] = [];
      practiceMap[uid].push(p);
    });

    const richApplicants = applications.map(app => {
      const uidStr = app.studentId.toString();
      const student = studentMap[uidStr] || {};
      const resume = resumeMap[uidStr];
      const studentMocks = mockMap[uidStr] || [];
      const studentInterviews = interviewMap[uidStr] || [];
      const studentPractice = practiceMap[uidStr] || [];
      const studentVerify = verifyMap[uidStr];

      // Calculate solved count & tracks
      let totalSolved = 0;
      let dsaSolved = 0;
      let sqlSolved = 0;
      let oopsSolved = 0;
      let totalAttempts = 0;
      studentPractice.forEach(p => {
        totalAttempts += (p.attemptsCount || 0);
        if (p.status === 'Solved') {
          totalSolved++;
          if (p.category === 'sql') sqlSolved++;
          else if (p.category === 'oops') oopsSolved++;
          else dsaSolved++;
        }
      });

      // Calculate Mock Test Stats
      const avgMockAccuracy = studentMocks.length > 0
        ? Math.round(studentMocks.reduce((acc, m) => acc + (m.accuracy || 0), 0) / studentMocks.length)
        : 0;

      // Calculate Interview Stats
      const avgTech = studentInterviews.length > 0
        ? Math.round(studentInterviews.reduce((acc, i) => acc + (i.scores?.technical || 0), 0) / studentInterviews.length)
        : 0;
      const avgComm = studentInterviews.length > 0
        ? Math.round(studentInterviews.reduce((acc, i) => acc + (i.scores?.communication || 0), 0) / studentInterviews.length)
        : 0;

      return {
        _id: app._id,
        jobId: app.jobId,
        studentId: app.studentId,
        studentName: app.studentName || student.name || 'Candidate',
        studentEmail: app.studentEmail || student.email || 'N/A',
        phoneNumber: student.phoneNumber || 'N/A',
        photoURL: student.photoURL || null,
        university: student.university || 'Not Specified',
        stream: student.stream || 'N/A',
        branch: student.branch || 'N/A',
        isVerified: student.isVerified || false,
        rank: student.rank || 1,
        tqScore: student.tqScore || 500,
        squadId: student.squadId || 'None',
        status: app.status || 'pending',
        appliedAt: app.appliedAt,
        hasResume: !!resume || app.hasResume,
        resumeFileName: resume?.fileName || app.resumeFileName || null,
        practiceStats: {
          totalSolved,
          dsaSolved,
          sqlSolved,
          oopsSolved,
          totalAttempts
        },
        mockTestStats: {
          count: studentMocks.length,
          avgAccuracy: avgMockAccuracy
        },
        interviewStats: {
          count: studentInterviews.length,
          avgTech,
          avgComm
        },
        verificationStatus: {
          isVerified: student.isVerified || false,
          certificateId: studentVerify?.certificateId || null
        }
      };
    });

    res.json({ success: true, applicants: richApplicants });
  } catch (error) {
    console.error('Fetch applicants error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get job details by ID
// @route   GET /api/jobs/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update application status (Accept / Shortlist / Reject / Pending)
// @route   PUT /api/jobs/applications/:id
// @access  Private (Recruiter only)
router.put('/applications/:id', protect, async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'shortlisted', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid application status' });
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
