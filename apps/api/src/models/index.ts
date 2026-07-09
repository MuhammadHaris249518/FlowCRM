import mongoose, { Schema, Document, Model } from "mongoose";

// Types
export type Role = "SUPER_ADMIN" | "ORG_OWNER" | "SALES_MANAGER" | "SALES_REP";

export interface IUser extends Document {
  clerkId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface IOrganization extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembership extends Document {
  role: "SUPER_ADMIN" | "ORG_OWNER" | "SALES_MANAGER" | "SALES_REP";
  userId: string;
  organizationId: string;
  createdAt: Date;
}

export interface ICompany extends Document {
  name: string;
  domain?: string;
  organizationId: string;
  createdAt: Date;
}

export interface IContact extends Document {
  fullName: string;
  email?: string;
  phone?: string;
  organizationId: string;
  companyId?: string;
  createdAt: Date;
}

export interface ILead extends Document {
  status: "NEW" | "CONTACTED" | "QUALIFIED" | "DISQUALIFIED" | "CONVERTED";
  source?: string;
  score: number;
  organizationId: string;
  contactId?: string;
  assigneeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeal extends Document {
  title: string;
  value: number;
  stage: "NEW" | "CONTACTED" | "QUALIFIED" | "MEETING" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST";
  organizationId: string;
  companyId?: string;
  contactId?: string;
  assigneeId?: string;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask extends Document {
  title: string;
  dueAt?: Date;
  completedAt?: Date;
  organizationId: string;
  assigneeId?: string;
  createdAt: Date;
}

export interface IActivity extends Document {
  type: "LEAD_CREATED" | "EMAIL_SENT" | "CALL_LOGGED" | "MEETING_SCHEDULED" | "DEAL_STAGE_CHANGED" | "NOTE_ADDED" | "TASK_COMPLETED";
  message: string;
  organizationId: string;
  actorId?: string;
  createdAt: Date;
}

// Schemas
const UserSchema = new Schema<IUser>({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  avatarUrl: String,
  createdAt: { type: Date, default: Date.now },
});

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const MembershipSchema = new Schema<IMembership>({
  role: { type: String, required: true, enum: ["SUPER_ADMIN", "ORG_OWNER", "SALES_MANAGER", "SALES_REP"] },
  userId: { type: String, required: true },
  organizationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const CompanySchema = new Schema<ICompany>({
  name: { type: String, required: true },
  domain: String,
  organizationId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ContactSchema = new Schema<IContact>({
  fullName: { type: String, required: true },
  email: String,
  phone: String,
  organizationId: { type: String, required: true },
  companyId: String,
  createdAt: { type: Date, default: Date.now },
});

const LeadSchema = new Schema<ILead>({
  status: { type: String, default: "NEW", enum: ["NEW", "CONTACTED", "QUALIFIED", "DISQUALIFIED", "CONVERTED"] },
  source: String,
  score: { type: Number, default: 0 },
  organizationId: { type: String, required: true },
  contactId: String,
  assigneeId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DealSchema = new Schema<IDeal>({
  title: { type: String, required: true },
  value: { type: Number, required: true },
  stage: { type: String, default: "NEW", enum: ["NEW", "CONTACTED", "QUALIFIED", "MEETING", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] },
  organizationId: { type: String, required: true },
  companyId: String,
  contactId: String,
  assigneeId: String,
  closedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  dueAt: Date,
  completedAt: Date,
  organizationId: { type: String, required: true },
  assigneeId: String,
  createdAt: { type: Date, default: Date.now },
});

const ActivitySchema = new Schema<IActivity>({
  type: { type: String, required: true, enum: ["LEAD_CREATED", "EMAIL_SENT", "CALL_LOGGED", "MEETING_SCHEDULED", "DEAL_STAGE_CHANGED", "NOTE_ADDED", "TASK_COMPLETED"] },
  message: { type: String, required: true },
  organizationId: { type: String, required: true },
  actorId: String,
  createdAt: { type: Date, default: Date.now },
});

// Models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export const Organization: Model<IOrganization> = mongoose.models.Organization || mongoose.model<IOrganization>("Organization", OrganizationSchema);
export const Membership: Model<IMembership> = mongoose.models.Membership || mongoose.model<IMembership>("Membership", MembershipSchema);
export const Company: Model<ICompany> = mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);
export const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);
export const Lead: Model<ILead> = mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);
export const Deal: Model<IDeal> = mongoose.models.Deal || mongoose.model<IDeal>("Deal", DealSchema);
export const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
export const Activity: Model<IActivity> = mongoose.models.Activity || mongoose.model<IActivity>("Activity", ActivitySchema);