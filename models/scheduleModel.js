import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  userId : { type: String, required: true},
  teacId : { type: String, required: true},
  slotDate: { type: String, required: true},
  slotTime: { type: String, required: true},
  userData: { type: Object, required: true},
  teacData: { type: Object, required: true},
  amount: { type:Number, required: true},
  date: {type: Number, required: true},
  cancelled: { type: Boolean, default: false},
  payment: {type: Boolean, default: false},
  isCompleted: { type: Boolean, default: false}
})

const scheduleModel = mongoose.models.schedule || mongoose.model('schedule', scheduleSchema)
export default scheduleModel