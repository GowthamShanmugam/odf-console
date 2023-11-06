import * as React from 'react';
import {
  APPLICATION_TYPE,
  SYNC_SCHEDULE_DISPLAY_TEXT,
} from '@odf/mco/constants';
import { parseSyncInterval } from '@odf/mco/utils';
import { matchExpressionSummary } from '@odf/shared/label-expression-selector';
import { Labels } from '@odf/shared/labels';
import {
  ReviewStepContent,
  ReviewStepContentItem,
} from '@odf/shared/reviewStepContent';
import { getName } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { Trans } from 'react-i18next';
import {
  AssignPolicyViewState,
  ObjectProtectionMethod,
  PVCSelectorType,
} from '../utils/reducer';
import '../style.scss';

const getLabels = (pvcSelectors: PVCSelectorType[]): string[] =>
  pvcSelectors.reduce((acc, selectors) => [...acc, ...selectors.labels], []);

export const ReviewAndAssign: React.FC<ReviewAndAssignProps> = ({
  state,
  workloadNamespace,
  appType,
}) => {
  const { t } = useCustomTranslation();
  const { policyRule, policy, persistentVolumeClaim, dynamicObjects } = state;
  const { drClusters, replicationType, schedulingInterval } = policy;
  const { pvcSelectors } = persistentVolumeClaim;
  const {
    captureInterval,
    objectProtectionMethod,
    recipeInfo,
    appResourceSelector,
  } = dynamicObjects;
  const isRecipeMethod =
    objectProtectionMethod === ObjectProtectionMethod.Recipe;
  const isOpenshiftApp = appType === APPLICATION_TYPE.OPENSHIFT;
  const selectorCount = pvcSelectors.length;
  const appResourceText =
    selectorCount > 1
      ? t('{{count}} placements', { count: selectorCount })
      : pvcSelectors[0].placementName;

  const labels = React.useMemo(() => getLabels(pvcSelectors), [pvcSelectors]);
  const expressions = React.useMemo(
    () =>
      appResourceSelector.map((expression) => (
        <li>{matchExpressionSummary(t, expression)}</li>
      )),
    [appResourceSelector, t]
  );

  const [unit, interval] = parseSyncInterval(schedulingInterval);

  return (
    <>
      {isOpenshiftApp && (
        <ReviewStepContent title={t('Policy rule')}>
          <ReviewStepContentItem>
            {t('Policy assignment rule: {{policyRule}}', { policyRule })}
          </ReviewStepContentItem>
          <ReviewStepContentItem>
            {t('Namesapce: {{Namespace}}', { Namespace: workloadNamespace })}
          </ReviewStepContentItem>
        </ReviewStepContent>
      )}
      <ReviewStepContent title={t('Data policy')}>
        <ReviewStepContentItem>
          {t('Policy name: {{policyName}}', { policyName: getName(policy) })}
        </ReviewStepContentItem>
        <ReviewStepContentItem>
          {t('Clusters: {{clusters}}', { clusters: drClusters.join(', ') })}
        </ReviewStepContentItem>
        <ReviewStepContentItem>
          {t('Replication type: {{replicationType}}', { replicationType })}
        </ReviewStepContentItem>
        <ReviewStepContentItem>
          {t('Sync interval: {{syncInterval}}', {
            syncInterval: `${interval} ${SYNC_SCHEDULE_DISPLAY_TEXT(t)[unit]}`,
          })}
        </ReviewStepContentItem>
      </ReviewStepContent>
      <ReviewStepContent title={t('PVC details')}>
        <ReviewStepContentItem>
          {t('Application resource: {{appResource}}', {
            appResource: appResourceText,
          })}
        </ReviewStepContentItem>
        <ReviewStepContentItem>
          <Trans t={t}>
            PVC label selector: <Labels numLabels={4} labels={labels} />
          </Trans>
        </ReviewStepContentItem>
      </ReviewStepContent>
      {isOpenshiftApp && (
        <ReviewStepContent title={t('Dynamic objects')}>
          <ReviewStepContentItem>
            {t('Protection method: {{protectionMethod}}', {
              protectionMethod: isRecipeMethod
                ? t('Recipe')
                : t('Resource label selector'),
            })}
          </ReviewStepContentItem>
          {isRecipeMethod ? (
            <>
              <ReviewStepContentItem>
                {t('Recipe name: {{name}}', {
                  name: recipeInfo.name,
                })}
              </ReviewStepContentItem>
              <ReviewStepContentItem>
                {t('Recipe namespace: {{namespace}}', {
                  namespace: recipeInfo.namespace,
                })}
              </ReviewStepContentItem>
            </>
          ) : (
            <ReviewStepContentItem>
              <Trans t={t}>
                Resource label selector:
                <div className="mco-manage-policies__radio-padding-left">
                  {...expressions}
                </div>
              </Trans>
            </ReviewStepContentItem>
          )}
          <ReviewStepContentItem>
            {t('Replication interval: {{captureInterval}}', {
              captureInterval,
            })}
          </ReviewStepContentItem>
        </ReviewStepContent>
      )}
    </>
  );
};

type ReviewAndAssignProps = {
  state: AssignPolicyViewState;
  workloadNamespace: string;
  appType: APPLICATION_TYPE;
};
