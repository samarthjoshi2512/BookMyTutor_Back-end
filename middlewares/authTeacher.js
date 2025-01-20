import jwt from 'jsonwebtoken'

// Teacherauthentication middleware
const authTeacher = async (req,res,next) => {
  try {
    
    const {ttoken} = req.headers
    if (!ttoken) {
      return res.json({success:false,message:"Not Authorized Login Again"})
    }
    const token_decode =jwt.verify(ttoken,process.env.JWT_SECRET)
    req.body.teacId = token_decode.id
    next()

  } catch (error) {
    console.log(error);
    res.json({ success: false, message:error.message });
  }
}

export default authTeacher