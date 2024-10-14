const { ObjectId } = require ('mongodb');
const bcrypt = require('bcryptjs');
const { getDb } = require("./mongodb");
const { requireBody } = require('./permissions');




exports.insertNewUser = async function (user) {
    try {
        const hash = await bcrypt.hash(user.password, 8);
        const result = await getDb().collection('users').insertOne({
            ...user,
            password: hash
        })
        return result.insertedId;

    } catch (e) {
        console.error(e);
        return null;
    }
   
}


async function getUserById(userId) {
    const cursor =  await getDb().collection('users').find({_id: new ObjectId(userId)}).toArray();
    return cursor[0]
}
exports.getUserById = getUserById;


async function getUserByEmail(email) {
    return await getDb().collection('users').find({email: email}).toArray();
}
exports.getUserByEmail = getUserByEmail;


exports.validateCredentials = async function (email, password){
    const user = await getUserByEmail(email);
    console.log('actions.js: waiting for bcrypt... ');
    return user && await bcrypt.compare(password, user[0].password);
}





