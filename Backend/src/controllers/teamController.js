import {
  createTeamService,
  getMyTeamsService,
  updateTeamRoleService,
  removeTeamMemberService,
  addTeamMemberService,
} from "../services/teamService.js";

export const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Team name is required",
      });
    }

    const team = await createTeamService({
      name,
      description,
      createdBy: req.user.id,
    });

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      data: {
        team,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyTeams = async (req, res) => {
  try {
    const teams = await getMyTeamsService(req.user.id);

    return res.status(200).json({
      success: true,
      data: {
        teams,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const addTeamMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { userId, role = "MEMBER" } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const member = await addTeamMemberService({
      teamId,
      userId,
      role,
    });

    return res.status(201).json({
      success: true,
      message: "Member added successfully",
      data: {
        member,
      },
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message: error.message,
      });
  }
};

export const updateTeamMemberRole = async(req,res)=>{
  try {
      
      const {teamId,userId} = req.params
      const {role} =  req.body

      if(!role){
        return res.status(400).json({
          success:false,
          message:"role is required"
        })
      }

      const member = await updateTeamRoleService({
        teamId,
        userId,
        role
      })

      return res.status(200).json({
        success:true,
        message:"Team member role updated successfully",
        data:{
          member
        }
      })

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success:false,
      message:error.message
    })
  }
}

export const removeTeamMember = async(req,res)=>{
  try{

    const {teamId,userId} = req.params

    await removeTeamMemberService({
      teamId,
      userId
    })
    return res.status(200).json({
      success:true,
      message:"Team member removed successfully"
    })
  }
  catch(error){
    return res.status(statusCode || 500).json({
      success:false,
      message:error.message
    })
  }
}