export type Department =
  | "Executive"
  | "Case Management"
  | "Clinical"
  | "Hospital Relations"
  | "Travel"
  | "Finance"
  | "Marketing"
  | "Referral Partners";

export type OperationsPriority = "Critical" | "High" | "Medium" | "Low";

export type WorkItemStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Waiting"
  | "Blocked"
  | "Completed"
  | "Cancelled"
  | "Escalated";

export type TaskCategory =
  | "Clinical"
  | "Hospital"
  | "Travel"
  | "Finance"
  | "Marketing"
  | "Referral"
  | "Documents"
  | "Emergency"
  | "Follow-up"
  | "Administration";

export type OperationsCase = {
  caseId: string;
  patientId: string;
  patientName: string;
  country: string;
  treatment: string;
  currentDepartment: Department;
  responsibleDepartment: Department;
  responsibleUser: string;
  currentOwner: string;
  previousOwner: string;
  nextDepartment: Department;
  nextOwner: string;
  currentStage: string;
  nextRequiredAction: string;
  priority: OperationsPriority;
  slaHours: number;
  processingTimeHours: number;
  dueDate: string;
  waitingHandoff: boolean;
  emergency: boolean;
  ownerMissing: boolean;
};

export type DepartmentWorkload = {
  department: Department;
  currentCases: number;
  activeTasks: number;
  urgentTasks: number;
  waitingTasks: number;
  completedToday: number;
  averageSla: string;
  lead: string;
};

export type OwnershipTransfer = {
  id: string;
  patient: string;
  caseId: string;
  currentDepartment: Department;
  currentOwner: string;
  previousOwner: string;
  nextDepartment: Department;
  nextOwner: string;
  transferDate: string;
  transferReason: string;
  approvedBy: string;
  receivedBy: string;
  ownershipTimeline: Array<{
    timestamp: string;
    user: string;
    action: string;
    notes: string;
  }>;
};

export type RolePermission = {
  permission: string;
  roles: string[];
};

export type WorkItem = {
  taskId: string;
  caseId: string;
  patientId: string;
  patientName: string;
  department: Department;
  owner: string;
  priority: OperationsPriority;
  dueDate: string;
  status: WorkItemStatus;
  category: TaskCategory;
  description: string;
  relatedModule: string;
  relatedHospital: string;
  relatedPartner: string;
};

export type Handoff = {
  id: string;
  fromDepartment: Department;
  toDepartment: Department;
  fromUser: string;
  toUser: string;
  reason: string;
  timestamp: string;
  accepted: boolean;
  rejected: boolean;
  notes: string;
  auditTrail: Array<{
    timestamp: string;
    user: string;
    action: string;
    notes: string;
  }>;
};

export type DepartmentDashboard = {
  department: Department;
  metrics: Array<{
    label: string;
    value: number;
  }>;
  focus: string;
};

export type OperationsData = {
  cases: OperationsCase[];
  departments: DepartmentWorkload[];
  ownershipTransfers: OwnershipTransfer[];
  roleMatrix: {
    roles: string[];
    permissions: RolePermission[];
  };
  workItems: WorkItem[];
  handoffs: Handoff[];
  departmentDashboards: DepartmentDashboard[];
};
