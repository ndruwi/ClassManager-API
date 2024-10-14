const redis =  require( 'redis')
const jwt = require("jsonwebtoken")
const { getUserById } = require('./actions')



const secretKey = process.env.JWT_KEY || "SuperSecret"

const redisHost = process.env.REDIS_HOST || 'localhost'
const redisPort = process.env.REDIS_PORT || '6379'


const redisUrl = `redis://${redisHost}:${redisPort}`
console.log(redisUrl)
const redisClient = redis.createClient({ url: redisUrl })
exports.redisClient = redisClient

const rateLimitWindowMs = 60000



exports.rateLimit = async function (req,res,next) {


    // check token 
    validated = false
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ? authHeaderParts[1] : null
    try {
    const payload = jwt.verify(token, secretKey)
    const user = await getUserById(payload.sub)
    
    if(user){
        validated = true
    }

    } catch (e) {
    // console.log(e)
    }


    console.log("validated?", validated)


    if(validated){
        const validMaxReqs = 30

        const ip = req.ip
        let tokenBucket
        try {
            tokenBucket = await redisClient.hGetAll(ip)
            console.log("tokenbucket from redis", tokenBucket)
            
        } catch (e) {
            next()
            return
        }

        tokenBucket = {
            tokens: parseFloat(tokenBucket.tokens) || validMaxReqs,
            last: parseInt(tokenBucket.last) || Date.now()
        }
        console.log("tokenBucket before ", tokenBucket)


        const timestamp = Date.now()
        const ellapsedTimeMs = timestamp - tokenBucket.last
        const refreshRate = validMaxReqs / rateLimitWindowMs
        tokenBucket.tokens += ellapsedTimeMs * refreshRate
        tokenBucket.tokens = Math.min(validMaxReqs, tokenBucket.tokens)
        tokenBucket.last = timestamp

        console.log("tokenBucket after ", tokenBucket)
        if (tokenBucket.tokens >= 1){
            tokenBucket.tokens -= 1
            await redisClient.hSet(ip, [
            ['tokens', tokenBucket.tokens],
            ['last', tokenBucket.last]
            ])
            next()
        } else {
            res.status(429).send({ err: "Too many requests"})
        }


    } else {

        const invalidMaxReqs = 10


        const ip = req.ip
        let tokenBucket
        try {
            tokenBucket = await redisClient.hGetAll(ip)
            console.log("tokenbucket from redis", tokenBucket)
            
        } catch (e) {
            next()
            return
        }

        tokenBucket = {
            tokens: parseFloat(tokenBucket.tokens) || invalidMaxReqs,
            last: parseInt(tokenBucket.last) || Date.now()
        }
        console.log("tokenBucket before ", tokenBucket)


        const timestamp = Date.now()
        const ellapsedTimeMs = timestamp - tokenBucket.last
        const refreshRate = invalidMaxReqs / rateLimitWindowMs
        tokenBucket.tokens += ellapsedTimeMs * refreshRate
        tokenBucket.tokens = Math.min(invalidMaxReqs, tokenBucket.tokens)
        tokenBucket.last = timestamp

        console.log("tokenBucket after ", tokenBucket)
        if (tokenBucket.tokens >= 1){
            tokenBucket.tokens -= 1
            await redisClient.hSet(ip, [
            ['tokens', tokenBucket.tokens],
            ['last', tokenBucket.last]
            ])
            next()
        } else {
            res.status(429).send({ err: "Too many requests"})
        }
    }
}