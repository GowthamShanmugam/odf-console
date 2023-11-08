import * as React from 'react';
import { REPLICATION_TYPE } from '@odf/mco/constants';
import { getDRPolicyStatus, getValidatedProp } from '@odf/mco/utils';
import { SingleSelectDropdown } from '@odf/shared/dropdown/singleselectdropdown';
import { getName } from '@odf/shared/selectors';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { TFunction } from 'i18next';
import { Form, FormGroup, SelectOption } from '@patternfly/react-core';
import {
  ManagePolicyStateAction,
  ManagePolicyStateType,
  ModalViewContext,
} from '../utils/reducer';
import { DRPolicyType, DataPolicyType } from '../utils/types';

const getDropdownOptions = (dataPolicies: DRPolicyType[], t: TFunction) =>
  dataPolicies.map((policy) => (
    <SelectOption
      key={getName(policy)}
      value={getName(policy)}
      description={
        policy.replicationType === REPLICATION_TYPE.ASYNC
          ? t(
              'Replication type: {{type}}, Interval: {{interval}}, Clusters: {{clusters}}',
              {
                type: policy.replicationType,
                interval: policy.schedulingInterval,
                clusters: policy.drClusters.join(', '),
              }
            )
          : t('Replication type: {{type}}, Clusters: {{clusters}}', {
              type: policy.replicationType,
              clusters: policy.drClusters.join(', '),
            })
      }
    />
  ));

const findPolicy = (name: string, dataPolicies: DRPolicyType[]) =>
  dataPolicies.find((policy) => getName(policy) === name);

export const SelectPolicyWizardContent: React.FC<SelectPolicyWizardContentProps> =
  ({ policy, matchingPolicies, isValidationEnabled, dispatch }) => {
    const { t } = useCustomTranslation();
    const name = getName(policy);
    return (
      <Form className="mco-manage-policies__form--width">
        <FormGroup
          fieldId="policy-type-selector"
          label={t('Policy name')}
          isRequired
          validated={getValidatedProp(isValidationEnabled && !name)}
          helperTextInvalid={t('Required')}
          helperText={
            !!policy &&
            t('Status: {{status}}', {
              status: getDRPolicyStatus(policy.isValidated, t),
            })
          }
        >
          <SingleSelectDropdown
            placeholderText={t('Select a policy')}
            selectOptions={getDropdownOptions(matchingPolicies, t)}
            id="policy-selection-dropdown"
            selectedKey={name}
            validated={getValidatedProp(isValidationEnabled && !name)}
            required
            onChange={(value: string) => {
              if (name !== value) {
                dispatch({
                  type: ManagePolicyStateType.SET_SELECTED_POLICY,
                  context: ModalViewContext.ASSIGN_POLICY_VIEW,
                  payload: findPolicy(value, matchingPolicies),
                });
              }
            }}
          />
        </FormGroup>
      </Form>
    );
  };

type SelectPolicyWizardContentProps = {
  policy: DataPolicyType;
  matchingPolicies: DRPolicyType[];
  isValidationEnabled: boolean;
  dispatch: React.Dispatch<ManagePolicyStateAction>;
};
