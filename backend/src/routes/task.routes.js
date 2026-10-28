const express = require('express');
const router = express.Router();
const {
  createTask,
  getNearbyTasks,
  getMyTasks,
  getTaskById,
  submitBid,
  acceptBid,
  rejectBid,
  cancelAssignment,
  startTask,
  submitProof,
  approveCompletion,
  cancelTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/nearby', optionalAuth, getNearbyTasks);
router.get('/my-tasks', protect, getMyTasks);
router.get('/:id', getTaskById);

router.post('/', protect, createTask);
router.post('/:id/bid', protect, submitBid);
router.post('/:id/accept-bid', protect, acceptBid);
router.post('/:id/reject-bid', protect, rejectBid);
router.post('/:id/cancel-assignment', protect, cancelAssignment);
router.post('/:id/start', protect, startTask);
router.post('/:id/submit-proof', protect, upload.array('proofImages', 5), submitProof);
router.post('/:id/approve-completion', protect, approveCompletion);
router.post('/:id/cancel', protect, cancelTask);
router.delete('/:id', protect, deleteTask);

module.exports = router;
