import express from 'express'
import { bookSchedule, cancelSchedule, getProfile, listSchedule, loginUser, paymentRazorpay, registerUser, updateProfile, verifyRazorpay } from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js'
import upload from '../middlewares/multer.js'

const userRouter = express.Router()

userRouter.post('/register',registerUser)
userRouter.post('/login',loginUser)

userRouter.get('/get-profile',authUser,getProfile)
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile)
userRouter.post('/book-schedule',authUser,bookSchedule)
userRouter.get('/schedules',authUser,listSchedule)
userRouter.post('/cancel-schedule',authUser,cancelSchedule)
userRouter.post('/payment-razorpay',authUser, paymentRazorpay)
userRouter.post('/verify-razorpay',authUser, verifyRazorpay)

export default userRouter