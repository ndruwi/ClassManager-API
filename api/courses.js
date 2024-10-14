const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const { validateAgainstSchema } = require('../lib/validation');
const { requireAuthentication } = require('../lib/auth');
const {
  CourseSchema,
    getCoursePage,
    insertNewCourse,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCourseStudents,
    updateCourseEnrollment,
    getCourseAssignments} = require('../models/course');
const { requireAdminOrInstructorForCourse, requireAdminOrInstructor} = require('../lib/permissions');

// Route to get a paginated list of courses
// requireAuthentication,
router.get('/',  async (req, res) => {
    const page = parseInt(req.query.page) || 1
    try {
      const coursePage = await getCoursePage(page)
      res.status(200).send(coursePage)
    } catch (err) {
      res.status(500).send({ error: 'Failed to fetch courses' })
    }
  })
  
// Route to insert a new course
// requireAuthentication, requireAdminOrInstructor,
router.post('/',  async (req, res) => {
try {
    const courseId = await insertNewCourse(req.body)
    res.status(201).send({ id: courseId })
} catch (err) {
    res.status(400).send({ error: 'Failed to create new course' })
}
})

// Route to get a course by ID
// requireAuthentication,
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
      if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: 'Invalid course ID format' });
      }

      const course = await getCourseById(new ObjectId(id));
      if (course) {
          res.status(200).send(course);
      } else {
          res.status(404).send({ error: 'Course not found' });
      }
  } catch (err) {
      console.error('Error fetching course:', err);
      res.status(500).send({ error: 'Failed to fetch course' });
  }
});

// Route to update course data
// requireAuthentication, requireAdminOrInstructorForCourse,
router.patch('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid course ID format' });
    }

    const updatedCourse = await updateCourse(new ObjectId(id), req.body);
    if (updatedCourse) {
      res.status(200).send(updatedCourse);
    } else {
      res.status(404).send({ error: 'andrew' });
    }
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).send({ error: 'Failed to update course' });
  }
});

// Route to delete a course
// requireAuthentication, requireAdminOrInstructorForCourse,
router.delete('/:id',  async (req, res) => {
  try {
    const deleted = await deleteCourse(req.params.id);
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(404).send({ error: 'Course not found' });
    }
  } catch (err) {
    res.status(500).send({ error: 'Failed to delete course' });
  }
});

// Route to fetch course students
// requireAuthentication, requireAdminOrInstructorForCourse,
router.get('/:id/students', async (req, res) => {
  const id = req.params.id;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid course ID format' });
    }

    const students = await getCourseStudents(new ObjectId(id));
    if (students) {
      res.status(200).send(students);
    } else {
      res.status(404).send({ error: 'Course not found' });
    }
  } catch (err) {
    console.error('Error fetching course students:', err);
    res.status(500).send({ error: 'Failed to fetch course students' });
  }
});

// Route to update course enrollment
// requireAuthentication, requireAdminOrInstructorForCourse,
router.post('/:id/students',  async (req, res) => {
  try {
    const updatedCourse = await updateCourseEnrollment(req.params.id, req.body.studentIds);
    if (updatedCourse) {
      res.status(200).send(updatedCourse);
    } else {
      res.status(404).send({ error: 'Course not found' });
    }
  } catch (err) {
    res.status(500).send({ error: 'Failed to update course enrollment' });
  }
});

// Route to fetch course roster as CSV
// requireAuthentication, requireAdminOrInstructorForCourse,
router.get('/:id/roster',  async (req, res) => {
  try {
    const students = await getCourseStudents(req.params.id);
    if (students) {
      const fields = ['studentId'];
      const opts = { fields };
      const parser = new Parser(opts);
      const csv = parser.parse(students);
      res.header('Content-Type', 'text/csv');
      res.attachment('roster.csv');
      res.status(200).send(csv);
    } else {
      res.status(404).send({ error: 'Course not found' });
    }
  } catch (err) {
    res.status(500).send({ error: 'Failed to fetch course roster' });
  }
});

// Route to fetch course assignments
// requireAuthentication,
router.get('/:id/assignments', async (req, res) => {
  const id = req.params.id;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ error: 'Invalid course ID format' });
    }

    const assignments = await getCourseAssignments(new ObjectId(id));
    if (assignments) {
      res.status(200).send(assignments);
    } else {
      res.status(404).send({ error: 'Course not found' });
    }
  } catch (err) {
    console.error('Error fetching course assignments:', err);
    res.status(500).send({ error: 'Failed to fetch course assignments' });
  }
});

module.exports = router;
