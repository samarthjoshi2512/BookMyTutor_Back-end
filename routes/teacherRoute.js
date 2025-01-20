import express from 'express'
import { loginTeacher, scheduleCancel, scheduleComplete, schedulesTeacher, teacherDashboard, teacherList, teacherProfile, updateTeacherProfile } from '../controllers/teacherController.js'
import authTeacher from '../middlewares/authTeacher.js'

const teacherRouter = express.Router()

teacherRouter.get('/list',teacherList)
teacherRouter.post('/login',loginTeacher)
teacherRouter.get('/schedules',authTeacher,schedulesTeacher)
teacherRouter.post('/complete-schedule',authTeacher,scheduleComplete)
teacherRouter.post('/cancel-schedule',authTeacher,scheduleCancel)
teacherRouter.get('/dashboard',authTeacher,teacherDashboard)
teacherRouter.get('/profile',authTeacher,teacherProfile)
teacherRouter.post('/update-profile',authTeacher,updateTeacherProfile)

export default teacherRouter