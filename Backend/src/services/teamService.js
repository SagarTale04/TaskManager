import sequelize from "../config/database.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import User from "../models/User.js";

export const createTeamService = async ({
  name,
  description,
  createdBy,
}) => {
  const transaction = await sequelize.transaction();

  try {
    const team = await Team.create(
      {
        name,
        description,
        createdBy,
      },
      {
        transaction,
      }
    );

    await TeamMember.create(
      {
        userId: createdBy,
        teamId: team.id,
        role: "OWNER",
        joinedAt: new Date(),
      },
      {
        transaction,
      }
    );

    await transaction.commit();

    return team;
  } catch (error) {
    await transaction.rollback();

    throw error;
  }
};

export const getMyTeamsService = async(userId)=>{
    const teams = await Team.findAll({
        include:[{
            model:TeamMember,
            as: "teamMembers",
            where:{
                userId
            },attributes:["role","joinedAt"]

    }]
    })
    return teams;
}
export const addTeamMemberService = async ({
  teamId,
  userId,
  role,
}) => {
  const user = await User.findByPk(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const existingMember = await TeamMember.findOne({
    where: {
      teamId,
      userId,
    },
  });

  if (existingMember) {
    const error = new Error(
      "User is already a member of this team"
    );

    error.statusCode = 409;
    throw error;
  }

  const allowedRoles = ["ADMIN", "MEMBER"];

  if (!allowedRoles.includes(role)) {
    const error = new Error("Invalid team role");
    error.statusCode = 400;
    throw error;
  }

  const member = await TeamMember.create({
    teamId,
    userId,
    role,
    joinedAt: new Date(),
  });

  return member;
};

export const updateTeamRoleService = async({teamId,userId,role})=>{
  const allowedRoles = ["ADMIN","MEMBER"];

  if(!allowedRoles.includes(role)){
    const error = new Error("Invalid team role")
    error.statusCode = 400;
    throw error;
  }


  const member = await TeamMember.findOne({
    where:{
      teamId,
      userId
    }
  });

  if(member.role==='OWNER'){
    const error =  new Error("owner role cannot be changed here ");
    error.statusCode = 403;
    throw error;
  }

  member.role = role
  await member.save();
  return member;
};

export const removeTeamMemberService = async ({ teamId, userId }) => {
  const member = await TeamMember.findOne({
    where: {
      teamId,
      userId,
    },
  });

  if (!member) {
    const error = new Error("Team member not found");
    error.statusCode = 404;
    throw error;
  }

  if (member.role === "OWNER") {
    const error = new Error("Team owner cannot be removed");
    error.statusCode = 403;
    throw error;
  }

  await member.destroy();

  return member;
};