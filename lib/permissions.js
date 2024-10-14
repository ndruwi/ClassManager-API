const { ObjectId } = require('mongodb')
const { getDb } = require("./mongodb")



//done
exports.requireBody = function (req, res, next){
    if(req.body == null){
        res.status(403).send({ err: "this requres requires a valid object in the request body."})
      } else next()
}

// done
exports.requireAdmin = function (req, res, next){
    if(req.userLogin.role != 3){
        res.status(403).send({ err: "this user is not authorized to make this request"})
      } else next()
}


exports.verifyAccountOwnerOrAdmin = function (req, res, next){
    if(req.userLogin.role != 3 && req.userLogin._id != req.params.id){
        res.status(403).send({ err: "this user is not authorized to make this request"})   
}
}

exports.requireAdminOrInstructor  = function (req, res, next){
    if(req.userLogin.role != 3 && req.userLogin.role != 2){
        res.status(403).send({ err: "this user is not authorized to make this request"})
      } else next()
}

exports.requireAdminOrInstructorForCourse = function (req, res, next){
    if(req.userLogin.role != 3 && req.userLogin._id != req.params.instructorId){
        res.status(403).send({ err: "this user is not authorized to make this request"})
    } else next()
}

exports.requireBody = async function (req, res, next){
    if(req.body == null){
        res.status(403).send({ err: "This request requires a valid body"})
      } else next()
}


exports.requireAccountOwner = async function (req, res, next){


    if((req.userLogin._id == req.params.id) || (req.userLogin.role == 3)){
        next()
     } else {
      res.status(403).send({
      error: "The user is not authorized to make this request"
    })
  }
}

exports.requireAccountPresence = async function (req, res, next){

  try{
      cursor = await getDb().collection('users').find({ _id: new ObjectId(req.params.id)}).toArray()

      if (cursor.length < 1){
          res.status(404).send({ err: "user not found."})

      } else {
          req.dbUserObject = cursor[0]
          next()
      }

  } catch(e){
      next(e)
  }
}

exports.requireUniqueEmail = async function (req, res, next){

    try{
        cursor = await getDb().collection('users').find({ email: req.body.email }).toArray()
  
        if (cursor.length > 0){
            res.status(404).send({ err: "This email is used by another user"})
        } else next()
  
    } catch(e){
        next(e)
    }
  }
