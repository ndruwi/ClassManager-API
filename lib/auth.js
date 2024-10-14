const jwt = require("jsonwebtoken")
const { getUserById } = require('./actions')


const secretKey = process.env.JWT_KEY || "SuperSecret"

exports.generateAuthToken = function (userId) {
  const payload = {
    sub: userId
  }
  return jwt.sign(payload, secretKey, { expiresIn: "30d" })
}


exports.requireAuthentication = async function (req, res, next) {
  const authHeader = req.get("Authorization") || ""
  const authHeaderParts = authHeader.split(" ")
  const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null

  try {
    const payload = jwt.verify(token, secretKey)
    console.log("payload", payload)

    const user = await getUserById(payload.sub)
    console.log("user", user)
    req.userLogin = user
    console.log("Request made by a user\nid: " + user._id + "\nemail: " + user.email + "\nrole: " + user.role)

    next()
  } catch (e) {
    res.status(401).send({
      error: "Valid authentication token required"
    })
  }
}



exports.conditionalAuthentication = async function (req, res, next){
  const authHeader = req.get("Authorization") || ""
  const authHeaderParts = authHeader.split(" ")
  const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null
  try{

    const payload = jwt.verify(token, secretKey)
    const user = await getUserById(payload.sub)

    if(user){
        req.userLogin = user
        req.isAuthenthicated == true
        next()
    } else {
        req.isAuthenthicated == false
        next()
    }
     
  } catch (e) {
      console.error(e)
      next(e)
  }
}


