import bcrypt from "bcrypt";
import { User } from "../models/index.js";
import generateToken from "../utils/generateToken.js";

export const registerUser = async ({
  name,
  email,
  password,
}) => {
  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "DEVELOPER",
  });

  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

export const loginUser = async({email,password})=>{

    const user = await User.findOne({
        where:{email}
    })

    if(!user){
        throw new Error("Invalid email or password")
    }

    const passwordMatch = await bcrypt.compare(password,user.passwordHash)

    if(!passwordMatch){
        throw new Error('invalid password')
    }

    const token = generateToken(user)

    return{
        user:{
            id:user.id,
            role:user.role,
            name:user.name,
            email:user.email
        },
        token
    }
};

