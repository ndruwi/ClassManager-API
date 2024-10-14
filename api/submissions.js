const express = require('express');
const router = express.Router();
const { updateSubmission } = require('../models/submission');
const { requireAdminOrInstructorForCourse } = require('../lib/permissions');
const { requireAuthentication } = require('../lib/auth');

router.patch('/:id', async (req, res) => {
  try {
    const updatedSubmission = await updateSubmission(req.params.id, req.body);
    res.status(200).json(updatedSubmission);
  } catch (err) {
    if (err.message === 'Submission not found') {
      res.status(404).send({ error: 'Submission not found' });
    } else {
      res.status(500).send({ error: err.message });
    }
  }
});

module.exports = router;
// db.submissions.find({ _id: ObjectId('666c11d1dff7103fa0b45bd8') })
