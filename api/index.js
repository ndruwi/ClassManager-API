const express = require('express')
const { Router } = require('express')
const { GridFSBucket } = require('mongodb');
const { getDb } = require('../lib/mongodb');
const { requireAuthentication } = require('../lib/auth');

const usersRouter = require('./users')
const coursesRouter = require('./courses')
const assignmentsRouter = require('./assignments')
const submissionsRouter = require('./submissions')

const router = Router()

router.use('/users', usersRouter)
router.use('/courses', coursesRouter)
router.use('/assignments', assignmentsRouter)
router.use('/submissions', submissionsRouter)

const { requireAdminOrInstructorForCourse } = require('../lib/permissions');

// GET /media/submissions/{filename}
// Downloads a Submission's associated file
//requireAuthentication
router.get('/media/submissions/:filename', async (req, res, next) => {
    try {
      const db = getDb();
      const bucket = new GridFSBucket(db, { bucketName: 'submissions' });
  
      const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
  
      downloadStream.on('error', (err) => {
        if (err.code === 'ENOENT') {
          return res.status(404).send({ error: 'File not found' });
        }
        return next(err);
      });
  
      downloadStream.on('file', (file) => {
        res.setHeader('Content-Type', file.metadata.contentType);
        res.setHeader('Content-Disposition', `attachment; filename=${file.filename}`);
      });
  
      downloadStream.pipe(res);
    } catch (err) {
      next(err);
    }
  });
  
  module.exports = router;