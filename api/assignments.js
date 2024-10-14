const express = require('express');
const router = express.Router();
const { validateAgainstSchema } = require('../lib/validation');
const { requireAuthentication } = require('../lib/auth');
const fs = require('fs');
const multer = require('multer');
const { promisify } = require('util');
const { GridFSBucket } = require('mongodb');
const { getDb } = require('../lib/mongodb');
const unlinkFile = promisify(fs.unlink);
const { ObjectId } = require('mongodb')

const {
    AssignmentSchema,
    insertNewAssignment,
    getAssignmentById,
    updateAssignmentById,
    deleteAssignmentById,
    getSubmissionsByAssignmentId 
} = require('../models/assignment');
const { requireAdminOrInstructorForCourse } = require('../lib/permissions');
const { insertNewSubmission, submissionSchema } = require('../models/submission');
const { getCourseById, isStudentEnrolledInCourse, } = require('../models/course');
const upload = multer({ dest: 'uploads/' });

// Create a new assignment
//requireAuthentication
router.post('/', async (req, res, next) => {
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        try {
            const id = await insertNewAssignment(req.body);
            res.status(201).send({ id: id });
        } catch (err) {
            next(err);
        }
    } else {
        res.status(400).send({ error: "Request body does not contain a valid Assignment." });
    }
});

// Fetch assignment by ID
//requireAuthentication
router.get('/:id', async (req, res, next) => {
    try {
        const assignment = await getAssignmentById(req.params.id);
        if (assignment) {
            res.status(200).send(assignment);
        } else {
            res.status(404).send({ error: "Assignment not found." });
        }
    } catch (err) {
        next(err);
    }
});

// Update assignment by ID
//requireAuthentication, requireAdminOrInstructorForCourse,
router.patch('/:id', async (req, res, next) => {
    if (validateAgainstSchema(req.body, AssignmentSchema)) {
        try {
            const updateSuccessful = await updateAssignmentById(req.params.id, req.body);
            if (updateSuccessful) {
                res.status(200).send({});
            } else {
                res.status(404).send({ error: "Assignment not found." });
            }
        } catch (err) {
            next(err);
        }
    } else {
        res.status(400).send({ error: "Request body does not contain a valid Assignment." });
    }
});

// Delete assignment by ID
//requireAuthentication, requireAdminOrInstructorForCourse, 
router.delete('/:id', async (req, res, next) => {
    try {
        const deleteSuccessful = await deleteAssignmentById(req.params.id);
        if (deleteSuccessful) {
            res.status(204).send({});
        } else {
            res.status(404).send({ error: "Assignment not found." });
        }
    } catch (err) {
        next(err);
    }
});

// Create a new submission
//requireAuthentication, 
router.post('/:id/submissions', upload.single('file'), async (req, res, next) => {
    const submissionData = {
      assignmentId: new ObjectId(req.params.id),  // Convert to ObjectId
      studentId: new ObjectId(req.body.studentId),  // Convert to ObjectId
      timestamp: new Date(),
      file: req.file.filename
    };
  
    console.log('Submission Data:', submissionData);  // Print submission data for debugging
  
    if (validateAgainstSchema(submissionData, submissionSchema)) {
      try {
        const db = getDb();
        const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
  
        const fileStream = fs.createReadStream(req.file.path);
        const uploadStream = bucket.openUploadStream(req.file.filename, {
          metadata: {
            assignmentId: new ObjectId(req.params.id),  // Convert to ObjectId
            studentId: new ObjectId(req.body.studentId),  // Convert to ObjectId
            contentType: req.file.mimetype
          }
        });
  
        fileStream.pipe(uploadStream)
          .on('error', (err) => {
            next(err);
          })
          .on('finish', async () => {
            try {
              await unlinkFile(req.file.path);
              const file = await bucket.find({ filename: req.file.filename }).toArray();
              if (file.length === 0) {
                throw new Error('File not found in GridFS after upload');
              }
  
              const id = await insertNewSubmission({
                assignmentId: new ObjectId(req.params.id),  // Convert to ObjectId
                studentId: new ObjectId(req.body.studentId),  // Convert to ObjectId
                timestamp: new Date(),
                file: file[0].filename,
                _id: file[0]._id
              });
  
              console.log('Inserted Submission ID:', id);  // Print inserted submission ID for debugging
  
              res.status(201).send({
                id: id,
                url: `/media/submissions/${file[0].filename}`
              });
            } catch (err) {
              next(err);
            }
          });
      } catch (err) {
        next(err);
      }
    } else {
      res.status(400).send({
        error: 'Request body is not a valid submission object or file is missing'
      });
    }
  });
  

// Fetch submissions for an assignment with pagination
//requireAuthentication, requireAdminOrInstructorForCourse, 
router.get('/:id/submissions', async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    try {
        const assignment = await getAssignmentById(req.params.id);
        if (!assignment) {
            return res.status(404).send({ error: 'Assignment not found.' });
        }

        const submissionsPage = await getSubmissionsByAssignmentId(req.params.id, page, pageSize);
        res.status(200).send(submissionsPage);
    } catch (err) {
        next(err);
    }
});
module.exports = router;