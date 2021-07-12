const express = require('express')
//////   insures that mongoose.js runs ///////////
require('./db/mongoose')
const router1 = require('./routers/user')
const router2 = require('./routers/task')


const app = express()
const port = process.env.PORT

// ***************************************////////   middleware  //////////******************************************** */

// app.use((req,res,next)=>{
//     // res.status(503).send('website is under construction')
//     if(req.method === 'GET'){
//         res.status(503).send('can not get')
//     }else{
//         next()
//     }
// })



//////////////////   For automatically parse incomming json /////////////////////
app.use(express.json())

app.use(router1)
app.use(router2)



app.listen(port,()=>{
    console.log('server at'+port);
})


