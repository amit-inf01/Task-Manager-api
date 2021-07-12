const express = require('express');
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = new express.Router();

// *********************************  Older versions(without async await) ****************************************


// app.post('/task',(req,res)=>{
//     const task = new Task(req.body) 
//     task.save().then(()=>{
//         res.status(201).send(task)
//     }).catch((err)=>{
//         // // to change error status code
//         // res.status(400)        
//         // res.send(err)
//         // or 
//         res.status(400).send(err)

//     })
// })



// app.get('/task/:id',(req,res)=>{
//     console.log(typeof req.params.id);
//     ////// in mongoose(in find by id) the id(req.params) is automatically converted from string to object
//     Task.findById(req.params.id).then((task)=>{
//         if(!task){
//             return res.status(404).send('No task found')
//         }
//         res.send(task)
//     }).catch((e)=>{
//         res.status(500).send(e)
//     })
// })


// ***********************************************************  with async await  *************************************************




router.post('/task',auth,async (req,res)=>{
    try{
        // const task = new Task(req.body) 
        // for setting relationship b/w task and user
        const task = new Task({
            // copy all the properties from req.body
            ...req.body,
            Owner: req.user._id
        })
        await task.save()
        // or 
        // await task.save()
        res.status(201).send(task)
    }catch(e){
        res.status(400).send(e)        
    }
})


//  /tasks?Completed=true
//  /tasks?limit=10&skip20    (3rd page)
//  /tasks?sortby=createdAt:desc
router.get('/tasks',auth, async (req,res)=>{
    try{
        const match = {}
        const sort = {}
        console.log(req.query.sortBy);
        if(req.query.Completed){
            match.Completed = req.query.Completed==='true'
        }
        if(req.query.sortBy){
            //  returning ['createdBy','desc'] from createdBy:desc
            const parts = req.query.sortBy.split(':')
            console.log(parts);

            sort[parts[0]]= parts[1] === 'desc' ? -1 : 1

        }
        // const tasks = await Task.find({Owner:req.user._id});
        //////////////////     or    ////////////////////////////////////////////
        await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks)
    }catch(e){
        res.status(500).send(e)        
    }

})

router.get('/task/:id',auth,async (req,res)=>{
    // console.log(typeof req.params.id);
    ////// in mongoose(in find by id) the id(req.params) is automatically converted from string to object
    try{
        // const task = await Task.findById(req.params.id);

        const task = await Task.findOne({_id:req.params.id, Owner:req.user._id})
        if(!task){
           return  res.status(404).send('No task found')
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }

})



router.patch("/task/:id",auth,async (req,res)=>{
    const updates = Object.keys(req.body);
    const allowedUpdates = ['Description','Completed']
    const isValid = updates.every((ele)=>  allowedUpdates.includes(ele)  )
    if(!isValid){
       return res.status(400).send('Invalid Update')
    }
    try{
        //   older (not useful in midware) ///////////////////
        // task = await Task.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})

        const task = await Task.findOne({_id:req.params.id, Owner:req.user._id})
        if(!task){
           return res.status(404).send('no task found')
        }
        updates.forEach((update)=>{
            task[update]= req.body[update]
        })
        await task.save()
        res.send(task)
    }catch(e){
        res.status(400).send(e)
    }
})





router.delete('/task/:id',auth, async (req,res)=>{
    try{
        const task = await Task.findOneAndDelete({_id:req.params.id,Owner:req.user._id})
        if(!task){
            return res.status(404).send('no user found')
        }
        res.send(task)
    }catch(e){
        res.status(500).send(e)
    }
})

module.exports = router;