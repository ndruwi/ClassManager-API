const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/mongodb');
const { extractValidFields } = require('../lib/validation');

const AssignmentSchema = {
    courseId: { required: true },
    title: { required: true },
    points: { required: true },
    due: { required: true },
};
exports.AssignmentSchema = AssignmentSchema;

async function insertNewAssignment(assignment) {
    assignment = extractValidFields(assignment, AssignmentSchema);
    const db = getDb();
    const assignments = db.collection('assignments');
    const result = await assignments.insertOne(assignment);
    return result.insertedId;
}
exports.insertNewAssignment = insertNewAssignment;

async function getAssignmentById(id) {
    const db = getDb();
    const assignment = await db.collection('assignments').findOne({ _id: new ObjectId(id) });
    return assignment;
}  
exports.getAssignmentById = getAssignmentById;

async function updateAssignmentById(id, assignment) {
    assignment = extractValidFields(assignment, AssignmentSchema);
    const db = getDb();
    const assignments = db.collection('assignments');
    const result = await assignments.updateOne(
        { _id: new ObjectId(id) },
        { $set: assignment }
    );
    return result.modifiedCount > 0;
}
exports.updateAssignmentById = updateAssignmentById;

async function deleteAssignmentById(id) {
    const db = getDb();
    const assignments = db.collection('assignments');
    const result = await assignments.deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
}
exports.deleteAssignmentById = deleteAssignmentById;

async function getAssignmentsByCourseId(courseId) {
    const db = getDb();
    const assignments = db.collection('assignments');
    const result = await assignments.find({ courseId: courseId }).toArray();
    return result;
}
exports.getAssignmentsByCourseId = getAssignmentsByCourseId;


async function getSubmissionsByAssignmentId(assignmentId, page, pageSize) {
    const db = getDb();
    const submissions = db.collection('submissions');
  
    // Log the assignment ID for debugging
    console.log('Fetching submissions for assignment ID:', assignmentId);
  
    const count = await submissions.countDocuments({ assignmentId: new ObjectId(assignmentId) });
    console.log('Number of submissions found:', count);  // Log the count of found submissions
  
    const lastPage = Math.ceil(count / pageSize);
    page = page > lastPage ? lastPage : page;
    page = page < 1 ? 1 : page;
    const offset = (page - 1) * pageSize;
  
    const result = await submissions.find({ assignmentId: new ObjectId(assignmentId) })
      .project({
        studentId: 1,
        file: 1,
        grade: 1,
        timestamp: 1
      })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(pageSize)
      .toArray();
  
    console.log('Submissions:', result);  // Log the result of the query
  
    return {
      submissions: result,
      page: page,
      totalPages: lastPage,
      pageSize: pageSize,
      count: count
    };
  }
exports.getSubmissionsByAssignmentId = getSubmissionsByAssignmentId;