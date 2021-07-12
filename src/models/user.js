const mongoose = require("mongoose")
//// for email or password input (puspose: show error when name is put on email)
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

/////////////////////////         old       ///////////////////////////
// const User = mongoose.model('User',{
//     name:{
//         type: String,
//         required: true,
//         trim: true
//     },
//     email:{
//         type: String,
//         required: true,
//         lowercase:true,
//         validate(value){
//             if(!validator.isEmail(value)){
//                 throw new Error('Email is Invalid')
//             }
//         },
//         trim: true
//     },
//     password:{
//         type: String,
//         required: true,
//         trim:true,
//         minlength:7,
//         validate(value){
//             if(value.toLowerCase().includes('password')){
//                 throw new Error('Password is invalid')
//             }
//         },
//     },
//     age:{
//         type: Number,
//         default:0,
//         validate(value){
//             if(value<0){
//                 throw new Error('Age must be positive')
//             }
//         }
//     }
    
// })



//////////////////////     for taking advantage of middleware    ////////////////////////////
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        trim: true
    },
    email:{
        unique: true,
        type: String,
        required: true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is Invalid')
            }
        },
        trim: true
    },
    password:{
        type: String,
        required: true,
        trim:true,
        minlength:7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password is invalid')
            }
        },
    },
    age:{
        type: Number,
        default:0,
        validate(value){
            if(value<0){
                throw new Error('Age must be positive')
            }
        }
    },
    tokens: [{
        token: {
            type:String,
            required:true
        }
    }],
    avatar: {
        type: Buffer
    }    
},{
    timestamps: true
})

////////   for creating virtual firld from user to tasks

userSchema.virtual('tasks',{
    ref: 'Task',
    localField:'_id',
    foreignField:'Owner'
})

/////////////////////////       middle ware      //////////////////////////////

//   function for finding user when someone gives his email and unhashed password---
userSchema.statics.findbyCredentials = async (email,password)=>{
    const user = await User.findOne({email})
    if(!user){
        console.log('invalid email');
        throw new Error ('Unable to login')
    }
    const isMatch = await bcrypt.compare(password,user.password)
    if(!isMatch){
        throw new Error ('Unable to login')
    }
    return user;
}

//   creating token for perticular user
userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({_id: user._id.toString() },process.env.SECRET)
    user.tokens = user.tokens.concat({token})
    await user.save()
    return token
    
}

// ****************************************************************
// toJSON runs even if we do not call this function because of JSON.Stringify()
//  refer playground 4
userSchema.methods.toJSON = function(){
    const userObject = this.toObject();

    delete userObject.password;
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}



// hashing the password before saving
userSchema.pre('save', async function(next){
    const user = this;

    // **********************************    isModified function  ************************//////////
    console.log(user.isModified('password'));
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password,8)
    }
    next();

})

//  delete user tasks when user is removed
userSchema.pre('remove', async function(next){
    await Task.deleteMany({Owner: this._id})
    next()    
})

const User = mongoose.model('User',userSchema)

module.exports = User
