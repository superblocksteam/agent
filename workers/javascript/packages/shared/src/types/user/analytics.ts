export enum USER_TASKS {
  COMPLETE_SURVEY = 'COMPLETE_SURVEY',
  VIEW_DEMO = 'VIEW_DEMO',
  VIEW_DEMO_VIDEO = 'VIEW_DEMO_VIDEO',
  DEPLOY_APP = 'DEPLOY_APP',
  INVITE_TEAMMATE = 'INVITE_TEAMMATE',
  DEPLOY_WORKFLOW = 'DEPLOY_WORKFLOW',
  DEPLOY_SCHEDULED_JOB = 'DEPLOY_SCHEDULED_JOB'
}

export enum ORG_TASKS {
  CONNECT_INTEGRATION = 'CONNECT_INTEGRATION'
}
export const TASKS = { ...USER_TASKS, ...ORG_TASKS };

export type TASKS = USER_TASKS | ORG_TASKS;

export type OnboardingTask = {
  id: TASKS;
  displayName?: string;
  viewed?: Date;
  completed?: Date;
};

export type UserOnboardingTask = OnboardingTask & {
  id: USER_TASKS;
};

export type OrgOnboardingTask = OnboardingTask & {
  id: ORG_TASKS;
};

export const isUserOnboardingTask = (task: OnboardingTask): task is UserOnboardingTask =>
  (Object.values(USER_TASKS) as TASKS[]).includes(task.id);
export const isOrgOnboardingTask = (task: OnboardingTask): task is OrgOnboardingTask =>
  (Object.values(ORG_TASKS) as TASKS[]).includes(task.id);

export type Checklist = {
  tasks: OnboardingTask[];
};

export type AnalyticsDto = {
  checklist?: Checklist;
  recommendedDatasources?: string[];
};

export type UserAnalyticsDto = AnalyticsDto;

export type OrganizationAnalyticsDto = AnalyticsDto;

export const getTasksFromAnalytics = (analytics: AnalyticsDto | undefined): OnboardingTask[] => {
  return analytics?.checklist?.tasks ?? [];
};

export const getRecommendedDatasourcesFromAnalytics = (analytics: AnalyticsDto | undefined): string[] => {
  return analytics?.recommendedDatasources ?? [];
};

export type SurveyAnswer = {
  questionId: string;
  selectedOptions: string[];
};

export type SurveyAnswers = {
  answers: SurveyAnswer[];
  version: string;
};

export const getRecommendedDatasourcesFromAnswers = (surveyAnswers: SurveyAnswers | undefined): string[] => {
  return (surveyAnswers?.answers?.find((answer) => answer.questionId === 'datasources')?.selectedOptions ?? [])
    .concat(surveyAnswers?.answers?.find((answer) => answer.questionId === 'apps')?.selectedOptions ?? [])
    .concat(['REST API']);
};
