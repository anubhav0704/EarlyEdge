import express from 'express';
import Squad from '../models/Squad.js';
import User from '../models/User.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Helper to notify active sockets (will hook in server.js)
const emitSquadUpdate = (req, squadId, type, data) => {
  const io = req.app.get('socketio');
  if (io) {
    io.emit('squad_global_update', { squadId, type, data });
  }
};

// @desc    Get all active squads
// @route   GET /api/squads
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const squads = await Squad.find({}).sort({ createdAt: -1 });
    res.json({ success: true, squads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new squad
// @route   POST /api/squads
// @access  Private (Student only)
router.post('/', protect, async (req, res) => {
  const { name } = req.body;

  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can create hiring squads' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Squad name is required' });
  }

  try {
    // Check if name conflict exists
    const conflict = await Squad.findOne({ name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } });
    if (conflict) {
      return res.status(400).json({ success: false, message: `A squad named "${name}" already exists` });
    }

    // Check if user is already in a squad
    if (req.user.squadId) {
      return res.status(400).json({ success: false, message: `You are already in squad "${req.user.squadId}". Leave it first.` });
    }

    const squad = await Squad.create({
      name: name.trim(),
      creatorId: req.user._id,
      creatorName: req.user.name,
      members: [{
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: 'Lead'
      }],
      memberCount: 1
    });

    // Update user's profile squad state
    await User.findByIdAndUpdate(req.user._id, { squadId: squad.name });

    emitSquadUpdate(req, squad._id, 'created', squad);

    res.status(201).json({ success: true, squad });
  } catch (error) {
    console.error('Create squad error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Join a squad
// @route   POST /api/squads/:id/join
// @access  Private (Student only)
router.post('/:id/join', protect, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Only students can join squads' });
  }

  if (req.user.squadId) {
    return res.status(400).json({ success: false, message: `You are already in squad "${req.user.squadId}". Leave it first.` });
  }

  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) {
      return res.status(404).json({ success: false, message: 'Squad not found' });
    }

    if (squad.members.length >= 5) {
      return res.status(400).json({ success: false, message: 'This squad is already full (max 5 members)' });
    }

    // Check if already a member
    const isMember = squad.members.some(m => m.id.toString() === req.user._id.toString());
    if (isMember) {
      return res.status(400).json({ success: false, message: 'You are already a member of this squad' });
    }

    const newMember = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: 'Member'
    };

    squad.members.push(newMember);
    squad.memberCount = squad.members.length;
    squad.lastUpdated = Date.now();
    await squad.save();

    // Update user profile
    await User.findByIdAndUpdate(req.user._id, { squadId: squad.name });

    emitSquadUpdate(req, squad._id, 'joined', { member: newMember, squad });

    res.json({ success: true, squad });
  } catch (error) {
    console.error('Join squad error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Leave a squad
// @route   POST /api/squads/:id/leave
// @access  Private (Student only)
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) {
      return res.status(404).json({ success: false, message: 'Squad not found' });
    }

    const isMember = squad.members.some(m => m.id.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(400).json({ success: false, message: 'You are not a member of this squad' });
    }

    // Filter out user from members list
    const leftMember = squad.members.find(m => m.id.toString() === req.user._id.toString());
    const remainingMembers = squad.members.filter(m => m.id.toString() !== req.user._id.toString());

    // Update user's profile
    await User.findByIdAndUpdate(req.user._id, { squadId: null });

    if (remainingMembers.length === 0) {
      // Last member left, delete squad
      await Squad.findByIdAndDelete(req.params.id);
      emitSquadUpdate(req, squad._id, 'deleted', { name: squad.name });
      return res.json({ success: true, message: 'Left squad and squad closed since all members left' });
    }

    // If leader left, transfer leadership
    if (squad.creatorId.toString() === req.user._id.toString()) {
      const newLeader = remainingMembers[0];
      squad.creatorId = newLeader.id;
      squad.creatorName = newLeader.name;
      
      // Update role of the new leader
      squad.members = remainingMembers.map((m, index) => {
        if (index === 0) {
          return { id: m.id, name: m.name, email: m.email, role: 'Lead' };
        }
        return m;
      });
    } else {
      squad.members = remainingMembers;
    }

    squad.memberCount = squad.members.length;
    squad.lastUpdated = Date.now();
    await squad.save();

    emitSquadUpdate(req, squad._id, 'left', { member: leftMember, squad });

    res.json({ success: true, squad });
  } catch (error) {
    console.error('Leave squad error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a squad permanently
// @route   DELETE /api/squads/:id
// @access  Private (Lead only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) {
      return res.status(404).json({ success: false, message: 'Squad not found' });
    }

    if (squad.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the squad leader can delete this squad' });
    }

    // Reset squadId for all members
    const memberIds = squad.members.map(m => m.id);
    await User.updateMany({ _id: { $in: memberIds } }, { squadId: null });

    await Squad.findByIdAndDelete(req.params.id);

    emitSquadUpdate(req, squad._id, 'deleted', { name: squad.name });

    res.json({ success: true, message: 'Squad deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Promote member to lead
// @route   POST /api/squads/:id/promote
// @access  Private (Lead only)
router.post('/:id/promote', protect, async (req, res) => {
  const { memberId } = req.body;

  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) {
      return res.status(404).json({ success: false, message: 'Squad not found' });
    }

    if (squad.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the squad leader can promote members' });
    }

    const member = squad.members.find(m => m.id.toString() === memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in squad' });
    }

    // Update members
    squad.members = squad.members.map(m => {
      if (m.id.toString() === memberId) {
        return { id: m.id, name: m.name, email: m.email, role: 'Lead' };
      } else if (m.id.toString() === req.user._id.toString()) {
        return { id: m.id, name: m.name, email: m.email, role: 'Member' };
      }
      return m;
    });

    squad.creatorId = member.id;
    squad.creatorName = member.name;
    squad.lastUpdated = Date.now();
    await squad.save();

    emitSquadUpdate(req, squad._id, 'promoted', { member, squad });

    res.json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Remove member from squad
// @route   POST /api/squads/:id/remove
// @access  Private (Lead only)
router.post('/:id/remove', protect, async (req, res) => {
  const { memberId } = req.body;

  try {
    const squad = await Squad.findById(req.params.id);
    if (!squad) {
      return res.status(404).json({ success: false, message: 'Squad not found' });
    }

    if (squad.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the squad leader can remove members' });
    }

    const member = squad.members.find(m => m.id.toString() === memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in squad' });
    }

    if (member.id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot kick yourself. Leave the squad instead.' });
    }

    // Remove from squad members array
    squad.members = squad.members.filter(m => m.id.toString() !== memberId);
    squad.memberCount = squad.members.length;
    squad.lastUpdated = Date.now();
    await squad.save();

    // Reset kicked member's user profile
    await User.findByIdAndUpdate(memberId, { squadId: null });

    emitSquadUpdate(req, squad._id, 'removed', { member, squad });

    res.json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
