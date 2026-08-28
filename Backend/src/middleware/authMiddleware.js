import jwt from "jsonwebtoken"

import User from '../models/User.js'

export const protect = async(req,res,next)=>{
    try{
    const authHeader = await req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer")){
        return res.status(401).json({
            success:false,
            message:"authorization token needed"
        })
    }

    const token = await authHeader.split(" ")[1];
    
    const decoded = jwt.verify(token,process.env.JWT_SECRET)

    const user  = await User.findByPk(decoded.id,
        {attributes:["id","name","email","role"]}
    )

    if(!user){
        return res.status(401).json({
            success:false,
            message:"user not found"
        })
    }
    req.user = user 
    next()

    

}
catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}