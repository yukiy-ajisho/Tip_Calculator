export interface Store {
  id: string;
  name: string;
  abbreviation: string;
}

export interface RoleMapping {
  standardRoleGroup: string;
  actualRoleName: string;
  traineeActualRoleName: string;
  traineePercentage: number;
}
