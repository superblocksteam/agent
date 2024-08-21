import {
  BasePlugin,
  DatasourceMetadataDto,
  ErrorCode,
  ExecutionOutput,
  formatExecutionOutput,
  IntegrationError,
  PluginExecutionProps,
  RawRequest,
  WorkflowActionConfiguration,
  WorkflowDatasourceConfiguration
} from '@superblocks/shared';
import { isEmpty } from 'lodash';

export default class WorkflowPlugin extends BasePlugin {
  pluginName = 'Workflow';

  async execute({
    context,
    datasourceConfiguration,
    actionConfiguration,
    files,
    agentCredentials,
    recursionContext,
    environment,
    profileId,
    profile,
    relayDelegate
  }: PluginExecutionProps<WorkflowDatasourceConfiguration, WorkflowActionConfiguration>): Promise<ExecutionOutput> {
    const loopStartIdx = recursionContext.executedWorkflowsPath.findIndex((workflow) => workflow.id === actionConfiguration.workflow);
    if (loopStartIdx >= 0) {
      throw new IntegrationError(
        `Cycle detected when executing workflow: ${recursionContext.executedWorkflowsPath
          .slice(loopStartIdx)
          .map((workflow) => workflow.name)
          .join(' -> ')} -> ${recursionContext.executedWorkflowsPath[loopStartIdx].name}. Workflows cannot be cyclical.`,
        ErrorCode.INTEGRATION_LOGIC,
        { pluginName: this.pluginName }
      );
    }

    const body: Record<string, unknown> = {};
    Object.entries(actionConfiguration.custom ?? {}).forEach(([key, property]) => {
      let val: unknown;
      try {
        val = JSON.parse(property.value ?? '');
      } catch (err) {
        val = property.value;
      }
      body[property.key ?? ''] = val;
    });
    const queryParams = actionConfiguration.queryParams ?? {};

    if (isEmpty(actionConfiguration.workflow)) {
      throw new IntegrationError(
        'No workflow selected, a workflow is required for workflow steps',
        ErrorCode.INTEGRATION_MISSING_REQUIRED_FIELD,
        { pluginName: this.pluginName }
      );
    }

    const res = await this.pluginConfiguration.workflowFetchAndExecuteFunc({
      apiId: actionConfiguration.workflow ?? '',
      isPublished: true,
      environment,
      profileId,
      profile,
      executionParams: [
        { key: 'body', value: body },
        { key: 'params', value: queryParams }
      ],
      agentCredentials,
      files: [],
      recursionContext,
      isWorkflow: true,
      relayDelegate
    });
    const ret = new ExecutionOutput();
    ret.output = formatExecutionOutput(res);
    return ret;
  }

  getRequest(actionConfiguration: WorkflowActionConfiguration): RawRequest {
    return '';
  }

  dynamicProperties(): string[] {
    return ['custom', 'queryParams'];
  }

  async metadata(datasourceConfiguration: WorkflowDatasourceConfiguration): Promise<DatasourceMetadataDto> {
    return {};
  }

  async test(datasourceConfiguration: WorkflowDatasourceConfiguration): Promise<void> {
    return;
  }
}
