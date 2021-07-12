const jwt = require('jsonwebtoken')
const User = require('../models/user')
 

const auth = async (req,res,next)=>{
    try{
        const token = req.header('Authorization').replace('Bearer ','')
        const decoded = jwt.verify(token,process.env.SECRET)
        const user = await User.findOne({_id: decoded._id, 'tokens.token':token})
        // console.log(token);
        if(!user){
            throw new Error()
        }
        // console.log(req.user);
        req.token = token;
        req.user = user;
        // console.log(req.user);
        next()
    }catch(e){
        res.status(401).send({error: "please authenticate."})
    }
}

module.exports =  auth;