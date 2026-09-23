Implement the SyncSprint frontend in my existing Next.js application using the attached UI screenshot as the main visual reference.

IMPORTANT:
Use the screenshot for DESIGN INSPIRATION, not for finance content. SyncSprint is a project/sprint/task management application.

Tech:
- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Existing Express backend at http://localhost:5000/api

DESIGN DIRECTION:
Match the reference closely in visual language:
- very light gray page background
- large rounded main application container
- white cards
- generous spacing
- soft borders instead of heavy shadows
- large rounded corners
- pill-shaped controls/navigation
- clean modern typography
- minimal green accent similar to the screenshot
- black/dark gray primary text
- muted gray secondary text
- compact circular icon buttons
- spacious premium SaaS appearance

Do NOT copy the finance dashboard content.

Build a SyncSprint layout based on it.

TOP HEADER:
- SyncSprint logo/name on left
- centered pill navigation:
  Dashboard
  My Tasks
  Projects
  Teams
- search icon
- notification icon
- user avatar/profile menu

LEFT ICON RAIL:
Use a narrow rounded vertical navigation similar to the screenshot with icons for:
- Dashboard
- Projects
- Sprints
- Tasks
- Teams
- Settings
- Logout

DASHBOARD:
Header:
"Welcome Back, {user name}"

Include a compact date/filter control and a "+ New Project" primary action.

Replace the finance cards with SyncSprint information:

Small cards:
- Active Projects
- Current Sprint
- Tasks Completed
- Team Members

MAIN LARGE CARD:
Current Sprint Progress

Show:
- sprint name
- sprint goal
- completion percentage
- completed/total tasks
- story points
- days remaining

Include a clean progress/chart visualization inspired by the reference.

RIGHT CARD:
Task Overview

Show counts for:
- TODO
- IN PROGRESS
- DONE

RECENT ACTIVITY / TASK TABLE:
Use the large bottom card style from the screenshot.

Columns:
Task
Project
Assignee
Priority
Status
Due Date

Use compact badges for priority and status.

PROJECT PAGE:
Create a project workspace maintaining the same visual system.

Header:
- project name
- project status
- team members/avatars
- current sprint
- actions

Tabs:
Overview
Board
Sprints
Tasks

KANBAN BOARD:
This is an important SyncSprint screen.

Create columns:
TODO
IN PROGRESS
DONE

Task cards should display:
- title
- priority
- assignee avatar
- story points
- due date where available

Keep cards compact and elegant rather than oversized.

TASK DETAIL:
Create a polished modal or side panel containing:
- title
- description
- status
- priority
- assignee
- sprint
- story points
- due date
- comments

AUTH:
Create a matching Login page using the same rounded, minimal visual language.

RESPONSIVENESS:
Desktop-first like the screenshot, but make the layout usable on tablet/mobile.

IMPLEMENTATION RULES:
- Use reusable components.
- Use TypeScript properly.
- Use Tailwind CSS 4.
- Keep components reasonably small.
- Do not add unnecessary UI libraries.
- Use an icon library only if one is already installed; otherwise choose one lightweight appropriate option.
- Do not use random gradients.
- Do not overuse shadows.
- Do not make every component green.
- Green should be an accent, similar to the reference.
- Maintain consistent spacing, radius, typography and button styles.

IMPORTANT:
For this stage, focus on building the visual frontend and reusable layout/components.

Do not rewrite or modify the existing backend.
Do not invent backend endpoints.
Do not implement WebSockets or Redis yet.
Do not add unnecessary features.

Before coding, inspect the existing frontend structure and preserve the existing Next.js/Tailwind setup.

Build the UI using the attached screenshot as the visual reference and adapt that design system specifically for SyncSprint.