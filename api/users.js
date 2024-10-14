const router = require('express').Router()
const { ObjectId } = require ('mongodb')
const {insertNewUser, getUserById, validateCredentials} = require('../lib/actions')
const { validateAgainstSchema, extractValidFields } = require('../lib/validation')
const { getDb } = require("../lib/mongodb")
const { generateAuthToken, requireAuthentication, conditionalAuthentication } = require('../lib/auth')
const { requireAdmin , requireBody, requireAccountOwner, requireAccountPresence ,requireUniqueEmail} = require('../lib/permissions')


// exports.router = router

// USER SCHEMA
const userSchema = {
  name: { required: true },
  email: { required: true },
  password: { required: true },
  role: { required: true }
}


// router.get('/special', async function (req, res, next) {
//   try {
//     // getDb().collection("users").deleteMany( {  } );
//     insertNewUser(req.body)
//   } catch (e) {
//     console.log(e)
//     next(e);
//   }
//   res.status(204).end()
// })


/*
 * Route to list all users (admin only)
 */
// 


router.get('/', requireAuthentication, requireAdmin, async function (req, res, next) {

  if(req.userIsAdmin == false){
    res.status(403).send({ err: "this user is not authorized to make this request"})
  } else {
    try{
      const collection = getDb().collection("users")
      const count = await collection.countDocuments()
      let page = parseInt(req.query.page) || 1
      const numPerPage = 10
      const lastPage = Math.ceil(count / numPerPage)
      page = page > lastPage ? lastPage : page
      page = page < 1 ? 1 : page
      
      const start = (page - 1) * numPerPage
  
      const links = {}
      if (page < lastPage) {
        links.nextPage = `/users?page=${page + 1}`
        links.lastPage = `/users?page=${lastPage}`
      }
      if (page > 1) {
        links.prevPage = `/users?page=${page - 1}`
        links.firstPage = '/users?page=1'
      }
  
      const results = await collection.find({})
        .sort({id: 1})
        .skip(start)
        .limit(numPerPage)
        .toArray()
  
      res.status(200).send({
        users: results,
        pageNumber: page,
        totalPages: lastPage,
        pageSize: numPerPage,
        totalCount: count,
        links: links
      })
  
    } catch (e) {
      next(e)
    }
  }
})


/*
 * Route to login.
 */
router.post('/login', async function(req, res, next){
  try{
    if (await validateCredentials(req.body.email, req.body.password)){

      console.log("auth sucess")
      const results = await getDb().collection('users').find({ email: req.body.email}).toArray()
      const token = generateAuthToken(results[0]._id)
      res.status(200).send({token: token})

    } else {

      console.log("auth failed")
      res.status(401).send({ error: "invalid credentials" })

    }

  } catch (e) {
    next(e)
  }
})

/*
 * Route to create a user.
 */
// conditionalAuthentication,
router.post('/', requireBody, requireUniqueEmail, async function (req, res, next) {

  if(( req.isAuthenthicated == false || req.userLogin.role != 3) && req.body.role == 3 ){
    res.status(403).send({err: "non-admin user tried to create an admin"})

  } else {

    if (validateAgainstSchema(req.body, userSchema)) {
      const user = extractValidFields(req.body, userSchema)

      try {

        console.log('users.js: calling insert new user')
        const id = await insertNewUser(user)
        res.status(201).send({
          id_: id,
          links: {
            user: `/users/${id}`
          }
        })

      } catch (e) {
        next(e)
      }

    } else {
      res.status(400).send({
        error: "Request body is not a valid business object"
      })
    }
  }
})

/*
 * Route to get a specific user 
 */

router.get(
  '/:id', 
  requireAuthentication, 
  requireAccountPresence, 
  requireAccountOwner, 
  async function (req, res) {

  const results = await getUserById(req.params.id)
  res.status(200).send({ user: results })

})

   
router.delete('/:id',
  requireAuthentication,
  requireAccountPresence,
  requireAccountOwner,
  async function (req, res, next) {

  try {
    await getDb().collection("users").deleteOne({ _id: new ObjectId(req.params.id) });
  } catch (e) {
    console.log(e)
    next(e);
  }

  res.status(204).end()
})


module.exports = router;
