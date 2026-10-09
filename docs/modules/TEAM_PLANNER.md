# Team planner

Updated 9 October 2026. Independent teams app uses canonical Employee, PlannerTeam
and PlannerTask. Root is a team register with open work; /teams/[teamId]/capacity
is the weekly work/capacity workspace. /teams/[teamId] retains calendar, people,
cover, places, moments and handovers.

Managers/recorded leads assign effort, start/deadline, priority and an optional
active company-goal link. Private goals cannot be linked. Members update their
own status. Changes bind task versions, recheck current same-company membership
and audit atomically. Completion removes open demand without deleting the task.
Estimates describe planned work, not recorded actual time.

Capacity uses published paid rota hours per day, otherwise contracted pattern/
company standard; breaks and non-work rota activities reduce it without double
counting overlap. Approved leave/unavailable days remove it and employment dates
bound it. Unavailable published shifts flag conflict without changing the rota.
Effort spreads over working days; a non-working deadline remains visible demand.

Only accessible teams contribute workload. Managers see all; members/leads see
membership teams. Totals explicitly describe visible work. Module enablement is
respected; pay, absence reasons and private notes are excluded. Named central
reads preserve desktop boundaries. No fabricated project or telephony integration.

Research/acceptance: [People overhaul](../plans/PEOPLE_PLATFORM_OVERHAUL.md).
