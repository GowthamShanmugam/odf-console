import * as React from 'react';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { Trans } from 'react-i18next';
import { AlertVariant } from '@patternfly/react-core';
import {
  ManagePolicyStateAction,
  ManagePolicyStateType,
  ModalViewContext,
  PolicyRule,
} from '../utils/reducer';
import { RadioSelection } from './radio-selection';
import '../style.scss';
import '../../../../style.scss';

export const PolicyRuleWizardContent: React.FC<PolicyRuleWizardContentProps> =
  ({ policyRule, dispatch }) => {
    const { t } = useCustomTranslation();
    const onChange = (ruleType: string) => {
      dispatch({
        type: ManagePolicyStateType.SET_POLICY_RULE,
        context: ModalViewContext.ASSIGN_POLICY_VIEW,
        payload: ruleType as PolicyRule,
      });
    };

    return (
      <>
        <RadioSelection
          title={t('Policy assignment rule')}
          description={t('Select the scope of your policy assignment')}
          alertTitle={t(
            'This is an OpenShift application type and has shared resources in the namespace.'
          )}
          alertVariant={AlertVariant.info}
          selected={policyRule}
          radioProps={[
            {
              className: 'mco-manage-policies__radio--margin-top',
              id: PolicyRule.Application,
              name: PolicyRule.Application,
              value: PolicyRule.Application,
              label: t('Application-specific'),
              description: t(
                'Use to secure only this application. Any existing applications, and new applications within the namespace[namespace] will need to be proactively secured.'
              ),
              onChange,
            },
            {
              className: 'mco-manage-policies__radio--margin-top',
              id: PolicyRule.Namespace,
              name: PolicyRule.Namespace,
              value: PolicyRule.Namespace,
              label: t('Namespace-wide'),
              description: (
                <Trans t={t}>
                  Use to secure all applications in the namesapce. All existing
                  and newly created applications present in the namespace
                  sharing the same PVC label selector will be protected when you
                  assign a policy.
                  <p>
                    <b>Namespace: ui-git-ansible</b>
                  </p>
                </Trans>
              ),
              onChange,
            },
          ]}
        />
      </>
    );
  };

type PolicyRuleWizardContentProps = {
  policyRule: PolicyRule;
  dispatch: React.Dispatch<ManagePolicyStateAction>;
};
