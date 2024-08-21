export interface DeploymentDto {
  commitId: string;
  previousCommitId?: string | null;
  entityId: string;
  deployer: {
    id: string;
    email: string;
    name: string;
  };
  deploymentId: string;
  deployMessage: string;
  deploymentTime: number;
}
