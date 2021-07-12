const mongoose = require("mongoose")
//// for email or password input (puspose: show error when name is put on email)

const taskSchema = mongoose.Schema(
    {
        Description:{
            type: String,
            required: true,
            trim: true
    
        },
        Completed: {
            type: Boolean,
            default: false
        },
        Owner:{
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        }
    },{
        timestamps: true
    }
)

const Task = mongoose.model('Task',taskSchema)


module.exports = Task;