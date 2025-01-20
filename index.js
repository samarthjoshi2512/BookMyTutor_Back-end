import express, { response }  from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import teacherRouter from './routes/teacherRoute.js'
import userRouter from './routes/userRoute.js'

// App config
const app = express()
const port = process.env.PORT || 4000
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api end points
app.use('/api/admin',adminRouter)
app.use('/api/teacher',teacherRouter)
app.use('/api/user',userRouter)

app.get('/demo',(req,res)=>{
  res.send('API WORKING')
})

app.listen(port,()=>{
  console.log("Server Started", port);
  
})
