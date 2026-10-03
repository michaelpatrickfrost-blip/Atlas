import { FolderKanban } from "lucide-react";
import type { ModuleManifest } from "@/core/modules/types";
export const projectsManifest:ModuleManifest = {id:"projects",name:"Projects",description:"Customer projects, progress and linked quotations.",icon:FolderKanban,version:"0.1.0",minimumCoreVersion:"0.1.0",dependencies:[],capabilities:["projects.read","projects.manage"],rootPath:"/projects",accessCapability:"projects.read",navigation:[{label:"Projects",href:"/projects"},{label:"Tasks",href:"/projects/tasks"},{label:"Meetings",href:"/projects/meetings"}],status:"available"};
