const { ObjectId } = require('mongodb');
const { extractValidFields } = require('../lib/validation');
const { getDb } = require('../lib/mongodb');

const submissionSchema = {
  assignmentId: { required: true },
  studentId: { required: true },
  timestamp: { required: false },
  grade: { required: false },
  file: { required: true }
};
exports.submissionSchema = submissionSchema;

async function updateSubmission(id, updateData) {
  const db = getDb();
  const submissions = db.collection('submissions');

  // Extract valid fields from updateData based on the submissionSchema
  const validFields = extractValidFields(updateData, submissionSchema);
  if (validFields.assignmentId) {
    validFields.assignmentId = new ObjectId(validFields.assignmentId);  // Convert to ObjectId
  }
  if (validFields.studentId) {
    validFields.studentId = new ObjectId(validFields.studentId);  // Convert to ObjectId
  }
  const objectId = new ObjectId(id);  // Ensure the ID is properly converted to ObjectId

  // Perform the update
  const result = await submissions.findOneAndUpdate(
    { _id: objectId },
    { $set: validFields },
    { returnOriginal: false, returnDocument: 'after' }
  );

  return result._id;
}

async function getSubmissionFile(filename) {
  const db = getDb();
  const submissions = db.collection('submissions');
  return await submissions.findOne({ file: filename });
}

async function insertNewSubmission(submission) {
  submission = extractValidFields(submission, submissionSchema);
  const db = getDb();
  const submissions = db.collection('submissions');
  const result = await submissions.insertOne(submission);
  return result.insertedId;
}

module.exports = {
  updateSubmission,
  getSubmissionFile,
  insertNewSubmission,
  submissionSchema
};
