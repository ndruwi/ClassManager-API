const { ObjectId } = require('mongodb')

const { getDb } = require('../lib/mongodb')
const { extractValidFields } = require('../lib/validation')

const CourseSchema = {
    subjectCode: { required: true },
    number: { required: true },
    title: { required: true },
    term: { required: true },
    instructorId: { required: true },
}
exports.CourseSchema = CourseSchema

async function getCoursePage(page) {
    const db = getDb()
    const courses = db.collection('courses')
    const count = await courses.countDocuments()

    const pageSize = 10
    const lastPage = Math.ceil(count / pageSize)
    page = page > lastPage ? lastPage : page
    page = page < 1 ? 1 : page
    const offset = (page - 1) * pageSize

    const result = await courses.find({})
        .sort({ courseId: 1 })
        .skip(offset)
        .limit(pageSize)
        .toArray()
    return {
        courses: result,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        count: count
    }
}
exports.getCoursePage = getCoursePage

async function insertNewCourse(course) {
    course = extractValidFields(course, CourseSchema)
    const db = getDb()
    const courses = db.collection('courses')
    const result = await courses.insertOne(course)
    return result.insertedId
}
exports.insertNewCourse = insertNewCourse

async function getCourseById(id) {
  try {
      const db = getDb();
      const courses = db.collection('courses');
      const result = await courses.findOne({ _id: new ObjectId(id) });
      return result;
  } catch (error) {
      console.error('Error in getCourseById:', error);
      throw error;
  }
}

async function updateCourse(id, updateData) {
  try {
    console.log('Updating course with ID:', id);
    console.log('Update data:', updateData);

    const db = getDb();
    const courses = db.collection('courses');
    
    const courseExists = await courses.findOne({ _id: new ObjectId(id) });
    if (!courseExists) {
      console.error('Course not found in database');
      return null;
    }

    const result = await courses.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' } // For MongoDB v4+
    );

    console.log('Update result:', result);
    return id;
  } catch (error) {
    console.error('Error in updateCourse:', error);
    throw error;
  }
}
  
  async function deleteCourse(id) {
    const db = getDb();
    const result = await db.collection('courses').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
  
  async function getCourseStudents(id) {
    try {
      console.log('Fetching students for course ID:', id);
      const db = getDb();
      const course = await db.collection('courses').findOne(
        { _id: new ObjectId(id) },
        { projection: { students: 1 } }
      );
  
      if (!course) {
        console.error('Course not found in database');
        return null;
      }
  
      console.log('Course found:', course);
      return course.students || [];
    } catch (error) {
      console.error('Error in getCourseStudents:', error);
      throw error;
    }
  }
  
  async function updateCourseEnrollment(id, studentIds) {
    const db = getDb();
    const result = await db.collection('courses').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { students: studentIds } },
      { returnOriginal: false }
    );
    return result.value;
  }
  
  async function getCourseAssignments(id) {
    try {
      console.log('Fetching assignments for course ID:', id);
      const db = getDb();
      const course = await db.collection('courses').findOne(
        { _id: new ObjectId(id) },
        { projection: { assignments: 1 } }
      );
  
      if (!course) {
        console.error('Course not found in database');
        return null;
      }
  
      console.log('Course found:', course);
      return course;
    } catch (error) {
      console.error('Error in getCourseAssignments:', error);
      throw error;
    }
  }
  
  module.exports = {
    CourseSchema,
    getCoursePage,
    insertNewCourse,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCourseStudents,
    updateCourseEnrollment,
    getCourseAssignments
  };