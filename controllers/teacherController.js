import teacherModel from "../models/teacherModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import scheduleModel from "../models/scheduleModel.js";

const changeAvailability = async (req, res) => {
  try {
    const { teacId } = req.body;

    const teacData = await teacherModel.findById(teacId);
    await teacherModel.findByIdAndUpdate(teacId, {
      available: !teacData.available,
    });
    res.json({ success: true, message: "Availability Changed" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const teacherList = async (req, res) => {
  try {
    const teachers = await teacherModel
      .find({})
      .select(["-password", "-email"]);

    res.json({ success: true, teachers });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for tecaher login
const loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await teacherModel.findOne({ email });

    if (!teacher) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);

    if (isMatch) {
      const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET);

      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get teacher schedules for teacher panel
const schedulesTeacher = async (req, res) => {
  try {
    const { teacId } = req.body;
    const schedules = await scheduleModel.find({ teacId });

    res.json({ success: true, schedules });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark  schedule completed
const scheduleComplete = async (req, res) => {
  try {
    const { teacId, scheduleId } = req.body;

    const scheduleData = await scheduleModel.findById(scheduleId);

    if (scheduleData && scheduleData.teacId === teacId) {
      await scheduleModel.findByIdAndUpdate(scheduleId, { isCompleted: true });
      return res.json({ success: true, message: "Schedule Completed" });
    } else {
      return res.json({ success: false, message: "Mark Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to mark  schedule cancelled
const scheduleCancel = async (req, res) => {
  try {
    const { teacId, scheduleId } = req.body;

    const scheduleData = await scheduleModel.findById(scheduleId);

    if (scheduleData && scheduleData.teacId === teacId) {
      await scheduleModel.findByIdAndUpdate(scheduleId, { cancelled: true });
      return res.json({ success: true, message: "Schedule Cancelled" });
    } else {
      return res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for tecaher panel
const teacherDashboard = async (req, res) => {
  try {
    const { teacId } = req.body;

    const schedules = await scheduleModel.find({ teacId });

    let earnings = 0;

    schedules.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });

    let students = [];

    schedules.map((item) => {
      if (!students.includes(item.userId)) {
        students.push(item.userId);
      }
    });

    const dashData = {
      earnings,
      schedules: schedules.length,
      students: students.length,
      latestschedules: schedules.reverse().slice(0, 5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get teacher profile for teacher panel
const teacherProfile = async (req, res) => {
  try {
    const { teacId } = req.body;
    const profileData = await teacherModel.findById(teacId).select("-password");

    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update teacher profile data from teacher panel

const updateTeacherProfile = async (req, res) => {
  try {
    const { teacId, fees, address, available } = req.body;

    await teacherModel.findByIdAndUpdate(teacId, { fees, address, available });

    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export {
  changeAvailability,
  teacherList,
  loginTeacher,
  schedulesTeacher,
  scheduleComplete,
  scheduleCancel,
  teacherDashboard,
  teacherProfile,
  updateTeacherProfile,
};
