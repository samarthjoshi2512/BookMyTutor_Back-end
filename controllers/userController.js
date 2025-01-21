import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import {v2 as cloudinary} from 'cloudinary'
import teacherModel from "../models/teacherModel.js";
import scheduleModel from "../models/scheduleModel.js";
import razorpay from 'razorpay'

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    // validating a strong password
    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong password" });
    }

    // validating name contains only alphabets
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return res.json({ success: false, message: "Name should contain only alphabets" });
    }

    // Hasing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");

    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }

    // validating name contains only alphabets
    if (!/^[A-Za-z\s]+$/.test(name)) {
      return res.json({ success: false, message: "Name should contain only alphabets" });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile){

      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
      const imageUrl = imageUpload.secure_url

      await userModel.findByIdAndUpdate(userId,{image:imageUrl})

    }
    res.json({success:true,message:"Profile Updated"})
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to book schedule
const bookSchedule = async (req,res) => {

  try {
    
    const {userId, teacId, slotDate, slotTime} = req.body

    const teacData = await teacherModel.findById(teacId).select('-password')

    if (!teacData.available) {
      return res.json({success:false,message:"Teacher not available"})
    }

    let slots_booked = teacData.slots_booked

    // checking for slots availability 
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({success:false,message:"Slot not available"})
      } else {
        slots_booked[slotDate].push(slotTime)
      }
    } else {
      slots_booked[slotDate] =[]
      slots_booked[slotDate].push(slotTime)
    }

    const userData = await userModel.findById(userId).select('-password')

    delete teacData.slots_booked

    const scheduleData = {
      userId,
      teacId,
      userData,
      teacData,
      amount:teacData.fees,
      slotTime,
      slotDate,
      date:Date.now()
    }

    const newSchedule = new scheduleModel(scheduleData)
    await newSchedule.save()
    
    // save new slots data in teachers data
    await teacherModel.findByIdAndUpdate(teacId,{slots_booked})

    res.json({success:true,message:"Schedule Booked"})
    
    
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
  
}

//  API to get user schedules for  frontend my-schedules page
const listSchedule = async (req,res) => {

  try {
    
    const {userId} =req.body
    const schedules = await scheduleModel.find({userId})

    res.json({success:true,schedules})

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }

}

// API to cancel appointment
const cancelSchedule = async (req,res) => {

  try {
    
    const {userId , scheduleId} = req.body

    const scheduleData = await scheduleModel.findById(scheduleId)

    // verify schedule user
    if (scheduleData.userId !== userId) {
      return res.json({success:false,message:"Unauthorized action"})
    }

    await scheduleModel.findByIdAndUpdate(scheduleId, {cancelled:true})

    // Releasing teacher slot

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

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

//  API to make payment of schedule using razorpay
const paymentRazorpay = async (req,res) => {

  try {
    const {scheduleId} = req.body
  const scheduleData = await scheduleModel.findById(scheduleId)

  if (!scheduleData || scheduleData.cancelled) {
    return res.json({success:false, message:"Schedule Cancelled or not found"})
  }

  // Creating options for raazorpay payment
  const options = {
    amount: scheduleData.amount *100,
    currency: process.env.CURRENCY,
    receipt: scheduleId,
  }

  // creation of an order 
  const order = await razorpayInstance.orders.create(options)

  res.json({success:true,order})
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }

}

//  API to verify payment of razorpay 
const verifyRazorpay = async (req,res) => {

  try {
    
    const {razorpay_order_id} = req.body
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

    if (orderInfo.status === 'paid') {
      await scheduleModel.findByIdAndUpdate(orderInfo.receipt, {payment:true})
      res.json({success:true, message:"Payment Successful"})
    } else{
      res.json({success:flase, message:"Payment Failed"})
    }
    

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}


export { registerUser, loginUser, getProfile, updateProfile, bookSchedule, listSchedule, cancelSchedule, paymentRazorpay, verifyRazorpay};
