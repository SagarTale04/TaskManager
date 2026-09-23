import bcrypt from "bcrypt";
import { User, Team, TeamMember } from "../models/index.js";
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

  // In non-test environments, automatically associate newly registered user with default workspace team
  if (process.env.NODE_ENV !== "test") {
    try {
      const defaultTeam = await Team.findOne({ order: [["id", "ASC"]] });
      if (defaultTeam) {
        await TeamMember.findOrCreate({
          where: {
            userId: user.id,
            teamId: defaultTeam.id,
          },
          defaults: {
            userId: user.id,
            teamId: defaultTeam.id,
            role: "MEMBER",
            joinedAt: new Date(),
          },
        });
      }
    } catch (teamErr) {
      console.warn("Could not automatically link registered user to default team:", teamErr);
    }
  }

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

