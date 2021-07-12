const express = require('express');
const User = require('../models/user')
// for file upload 
const multer = require('multer')
// for croping and formating an image
const sharp = require('sharp')
//  for using middleware for some routers (not necessary all the routers)
const auth = require('../middleware/auth')

const router = new express.Router();

// *********************************  Older versions(without async await) ****************************************


// app.post('/user', (req,res)=>{
//     const user = new User(req.body) 
//     user.save().then(()=>{
//         res.status(201).send(user)
//     }).catch((err)=>{
//         // // to change error status code
//         // res.status(400)        
//         // res.send(err)
//         // or 
//         res.status(400).send(err)

//     })
// })


// app.get('/user',(req,res)=>{
//     User.find({}).then((users)=>{
//         res.send(users)
//     }).catch((e)=>{
//         res.status(5000).send(e)
//     })
// })

// app.get('/user/:id',(req,res)=>{
//     console.log(typeof req.params.id);
//     ////// in mongoose(in find by id) the id(req.params) is automatically converted from string to object
//     User.findById(req.params.id).then((user)=>{
//         if(!user){
//             return res.status(404).send('User not found')
//         }
//         res.send(user)
//     }).catch((e)=>{
//         res.status(500).send(e)
//     })
// })

// app.get('/task',(req,res)=>{
//     Task.find({}).then((tasks)=>{
//         res.send(tasks)
//     }).catch((e)=>{
//         res.status(500).send(e)
//     })
// })
router.post('/user',async (req,res)=>{
    const user = new User(req.body) 
    try{
        await user.save();
        const token = await user.generateAuthToken();
        res.status(201).send({user,token})
    }catch(e){
        res.status(400).send(e)        
    }
})


router.post('/user/login', async (req,res)=>{
    try{
        // console.log(req.body);
        const user = await User.findbyCredentials(req.body.email,req.body.password)
        console.log(user.toObject());
        const token = await user.generateAuthToken();
        // console.log(token);
        res.send({user,token})

    }catch(e){
        res.status(400).send()        
    }
})

router.post('/user/logout',auth,async (req,res)=>{
    try{
        // *******************for logging out from only one device  ****************
        req.user.tokens = req.user.tokens.filter((ele)=> ele.token !== req.token )
        await req.user.save();
        res.send('logged out')
    }catch(e){
        res.status(500).send(e)
    }
})


router.post('/user/logoutAll',auth,async (req,res)=>{
    try{
        req.user.tokens = []
        await req.user.save();
        res.send('logged out')
    }catch(e){
        res.status(500).send(e)
    }
})




router.get('/user/me', auth, async (req,res)=>{
    res.send(req.user)
})


router.get('/user/:id',async (req,res)=>{
    console.log(typeof req.params.id);
    ////// in mongoose(in find by id) the id(req.params) is automatically converted from string to object
    try{
        const user = await User.findById(req.params.id);
        if(!user){
           return  res.status(404).send('No user found')
        }
        res.send(user)
    }catch(e){
        res.status(500).send(e)
    }

})

router.patch('/user/me',auth,async (req,res)=>{
    //  for knowing the values being updated
    // console.log(Object.keys(req.body));
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name','email','password','age']
    const isValidUpdate = updates.every((ele)=>{
        return allowedUpdates.includes(ele)
    })
    if(!isValidUpdate){
        console.log(isValidUpdate);
       return res.status(400).send('Invalid Update')
    }
    try{
        ////////   line below will not work for moddle ware //////////////////////
        // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new:true, runValidators:true})
        // ********** another way *****************  //
        updates.forEach((update)=>{
            req.user[update] = req.body[update]
        })

        await req.user.save();
        res.send(req.user)
        // console.log(user);
    }catch(e){
        res.status(400).send(e)
    }
   
})

router.delete('/user/me',auth, async (req,res)=>{
    try{
        await req.user.remove();
        // we can also delete all the tasks of deleted user from here
        res.send(req.user)
    }catch(e){
        res.status(500).send(e)
    }
})

upload = multer({
    //  removing dest because we do not want to store the image on file system
    // dest: 'images',
    limits:{
        fileSize: 400000
    },
    fileFilter(req,file,cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error('file formate not supported'))
        }
        cb(undefined, true)
        // cd(undefined, false)

    }
})

// //  error handelling
// const error = (req,res,next)=>{
//     throw new Error('From error')
// }

// router.post('/user/me/avatar',error,(req,res)=>{
//     res.send('ok')
// }, (err,req,res,next)=>{
//     res.status(400).send({error: err.message})
// })


router.post('/user/me/avatar',auth,upload.single('avatar'),async (req,res)=>{

    const buffer =await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save()
    res.send('ok')
}, (err,req,res,next)=>{
    res.status(400).send({error: err.message})
})

router.delete('/user/me/avatar',auth, async (req,res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send('profile deleted')
    
})

router.get('/user/:id/avatar', async(req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.avatar){
            throw new Error()
        }
        // default res.set 
        // res.set('Content-Type','application/json')

        res.set('Content-Type','image/png')
        res.send(user.avatar)


    }catch(e){
        res.status(400).send();
    }
})



module.exports = router;