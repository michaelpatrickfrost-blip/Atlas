/** Localisation templates. They help a business organise its duties.
 *  They are not legal advice and they do not make the organisation compliant. */

export const GB_SAFETY_TEMPLATE_VERSION = "GB-SAFETY-TEMPLATES-1";

export const GB_OBLIGATION_TEMPLATES: Array<{ jurisdiction: string; topic: string; requirement: string; source: string; frequency: string }> = [
  { jurisdiction: "GB", topic: "General risk management", requirement: "Assess significant risks and keep the assessments under review.", source: "Management of Health and Safety at Work Regulations 1999", frequency: "Review when the work changes, and at the planned date" },
  { jurisdiction: "GB", topic: "RIDDOR", requirement: "A responsible person reviews specified events and keeps the decision, and any report, with the incident.", source: "Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013", frequency: "On the event" },
  { jurisdiction: "GB", topic: "COSHH", requirement: "Assess hazardous substances before use and review when the substance, the task or the safety data sheet changes.", source: "Control of Substances Hazardous to Health Regulations 2002", frequency: "Review on change and at the planned date" },
  { jurisdiction: "GB", topic: "PUWER", requirement: "Work equipment is suitable, guarded, inspected and maintained, and people are competent to use it.", source: "Provision and Use of Work Equipment Regulations 1998", frequency: "Inspection scheme" },
  { jurisdiction: "GB", topic: "LOLER", requirement: "Lifting equipment and accessories are examined by a competent person and serious defects are taken out of use.", source: "Lifting Operations and Lifting Equipment Regulations 1998", frequency: "Examination scheme" },
  { jurisdiction: "GB", topic: "DSE", requirement: "Display screen users can assess their workstation and get follow-up where something is not right.", source: "Health and Safety (Display Screen Equipment) Regulations 1992", frequency: "When the workstation changes, and on request" },
  { jurisdiction: "GB", topic: "Manual handling", requirement: "Avoid hazardous manual handling where practical, and assess what remains.", source: "Manual Handling Operations Regulations 1992", frequency: "Review on change" },
  { jurisdiction: "GB", topic: "Work at height", requirement: "Avoid work at height where practical, otherwise prevent a fall, otherwise reduce the distance and the consequences.", source: "Work at Height Regulations 2005", frequency: "Before the work, and when conditions change" },
  { jurisdiction: "GB", topic: "First aid", requirement: "Provide first-aid arrangements that match the workplace, the workforce and the hazards.", source: "Health and Safety (First-Aid) Regulations 1981", frequency: "Review when the workplace changes" },
  { jurisdiction: "GB", topic: "Fire safety", requirement: "Keep a fire risk assessment, emergency arrangements and checks of the precautions.", source: "Regulatory Reform (Fire Safety) Order 2005", frequency: "Review on change and at the planned date" },
];
