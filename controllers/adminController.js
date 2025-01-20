import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import teacherModel from "../models/teacherModel.js";
import jwt from 'jsonwebtoken'
import scheduleModel from "../models/scheduleModel.js";
import userModel from "../models/userModel.js";

// Exporting addTeacher as a named export
 const addTeacher = async (req, res) => {
  try {
    const { name, email, password, subject, degree, experience, about, fees, address } = req.body;
    const imageFile = req.file

    // Checking for all data to add teachers
    if (!name || !email || !password || !subject || !degree || !experience || !about || !fees || !address) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // Validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    // Validating strong password
    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password" });
    }

    // Check for image file
    if (!imageFile) {
      return res.json({ success: false, message: "Image file is missing" });
    }

        // Handle `address` parsing
        let parsedAddress;
        if (typeof address === "string") {
          try {
            parsedAddress = JSON.parse(address);
          } catch (error) {
            return res.json({ success: false, message: "Invalid address format." });
          }
        } else if (typeof address === "object") {
          parsedAddress = address;
        } else {
          return res.json({ success: false, message: "Invalid address format." });
        }
    

    // Hashing teacher password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" })
    const imageUrl = imageUpload.secure_url;

    const teacherData = {
      name,
      email,
      image:imageUrl,
      password:hashedPassword,
      subject,
      degree,
      experience,
      about,
      fees,
      address:parsedAddress,
      date:Date.now(),
    };

    const newTeacher = new teacherModel(teacherData);
    await newTeacher.save();

    res.json({ success: true, message: "Teacher Added Successfully" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message:error.message });
  }
}

// API For admin login
const loginAdmin = async(req,res) =>{
  try {
    
    const {email,password} =req.body

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){

      const token = jwt.sign(email+password,process.env.JWT_SECRET)
      res.json({success:true,token})

    } else{
      res.json({success:false,message:"Invalid credentials"})
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message:error.message });
  }
}

// API to get all teachers list for admin panel
const allTeachers = async (req,res) => {
    try {
      
      const teachers = await teacherModel.find({}).select('-password');
      res.json({success:true,teachers})


    } catch (error) {
      console.log(error);
    res.json({ success: false, message:error.message });
    }
}

// API to get all schedules list
const schedulesAdmin = async (req,res) => {

  try {
    
    const schedules = await scheduleModel.find({})
    res.json({success:true,schedules})

  } catch (error) {
    console.log(error);
    res.json({ success: false, message:error.message });
  }

}

// API for schedule cancelation

const scheduleCancel = async (req,res) => {

  try {
    
    const {scheduleId} = req.body

    const scheduleData = await scheduleModel.findById(scheduleId)

    await scheduleModel.findByIdAndUpdate(scheduleId, {cancelled:true})

    // Releasing doctor slot

    const {teacId, slotDate, slotTime} = scheduleData
    
    const teacherData = await teacherModel.findById(teacId) 

    let slots_booked = teacherData.slots_booked

    slots_booked[slotDate] = slots_booked[slotDate].filter(e=> e !== slotTime)

    await teacherModel.findByIdAndUpdate(teacId, {slots_booked})

    res.json({success:true, message:"Schedule Cancelled"})

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// API to get dashboard data for admnin panel
const adminDashboard = async (req,res) => {

  try {
    
    const teachers = await teacherModel.find({})
    const users = await userModel.find({})
    const schedules = await scheduleModel.find({})

    const dashData = {
      teachers: teachers.length,
      schedules: schedules.length,
      students: users.length,
      latestSchedules: schedules.reverse().slice(0,5)
    }

    res.json({success:true,dashData})

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }

}

export {addTeacher, loginAdmin, allTeachers, schedulesAdmin, scheduleCancel, adminDashboard}