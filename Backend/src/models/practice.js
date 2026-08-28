import bcrypt from "bcrypt"
import {User} from "../models/index.js"
import generateToken from "../utils/generateToken.js"

export const registerUser = async ({name,email,password})=>{

    const existingUser = await User.findOne({
        where:email
    })
    if(existingUser){
        throw new Error ('user exists')
    }

    const passwordHash = await bcrypt.hash(password,10)

    const user = await User.create({
        email,
        name,
        passwordHash,
        role:developer
    })

    const token  = generateToken(user)

    return {
        user:{
            id:user.id,
            name:user.name,
            name:user.name,
            email:user.email
        },
        token
    }
}