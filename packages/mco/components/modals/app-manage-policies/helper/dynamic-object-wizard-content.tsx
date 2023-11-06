import * as React from 'react';
import { SYNC_SCHEDULE_DISPLAY_TEXT } from '@odf/mco/constants';
import { parseSyncInterval } from '@odf/mco/utils';
import { LazyLabelExpressionSelector } from '@odf/shared/label-expression-selector/labelExpressionSelector';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { RequestSizeInput } from '@odf/shared/utils/RequestSizeInput';
import { Form, FormGroup } from '@patternfly/react-core';
import {
  DynamicObjectType,
  ManagePolicyStateAction,
  ManagePolicyStateType,
  ModalViewContext,
  ObjectProtectionMethod,
} from '../utils/reducer';
import { RadioSelection } from './radio-selection';
import { RecipeSelector } from './recipe-selector';
import '../style.scss';

const options = {
  'cluster.open-cluster-management.io/clusterset': {
    key: {
      text: 'cluster.open-cluster-management.io/clusterset',
    },
    values: [{ text: 'default' }],
  },
  'feature.open-cluster-management.io/addon-application-manager': {
    key: {
      text: 'feature.open-cluster-management.io/addon-application-manager',
    },
    values: [{ text: 'available' }, { text: 'not available' }],
  },
};

const ReplicationInterval: React.FC<ReplicationIntervalProps> = ({
  captureInterval,
  dispatch,
}) => {
  const { t } = useCustomTranslation();
  const [selectedUnit, interval] = parseSyncInterval(captureInterval);
  const onChange = (event) => {
    const { value, unit } = event;
    dispatch({
      type: ManagePolicyStateType.SET_CAPTURE_INTERVAL,
      context: ModalViewContext.ASSIGN_POLICY_VIEW,
      payload: `${value}${unit}`,
    });
  };

  return (
    <Form>
      <FormGroup
        className="mco-manage-policies__radio--margin-top"
        label={t('Kubernetes object replication interval')}
        helperText={t(
          'Define the interval for Kubernetes object replication, this is only applicable for Kubernetes object and not application data.'
        )}
        isHelperTextBeforeField
      >
        <FormGroup
          className="mco-manage-policies__radio--margin-top"
          fieldId="sync-schedule"
          label={t('Interval')}
          isRequired
        >
          <RequestSizeInput
            name={t('Interval')}
            onChange={onChange}
            dropdownUnits={SYNC_SCHEDULE_DISPLAY_TEXT(t)}
            defaultRequestSizeUnit={selectedUnit}
            defaultRequestSizeValue={interval.toString()}
          />
        </FormGroup>
      </FormGroup>
    </Form>
  );
};

export const DynamicObjectWizardContent: React.FC<DynamicObjectWizardContentProps> =
  ({ workLoadNamespace, dynamicObjects, isValidationEnabled, dispatch }) => {
    const { t } = useCustomTranslation();
    const {
      objectProtectionMethod,
      appResourceSelector,
      captureInterval,
      recipeInfo,
    } = dynamicObjects;

    const onChange = (method: string) => {
      dispatch({
        type: ManagePolicyStateType.SET_OBJECT_PROTECTION_METHOD,
        context: ModalViewContext.ASSIGN_POLICY_VIEW,
        payload: method as ObjectProtectionMethod,
      });
    };

    return (
      <>
        <RadioSelection
          title={t('Protect Kubernetes objects')}
          description={t(
            'For your imperative applications, select a method to protect Kubernetes deployed dynamic objects'
          )}
          selected={objectProtectionMethod}
          radioProps={[
            {
              className:
                'mco-manage-policies__radio--margin-top mco-manage-policies__radio--width',
              id: ObjectProtectionMethod.ResourceLabelSelector,
              name: ObjectProtectionMethod.ResourceLabelSelector,
              value: ObjectProtectionMethod.ResourceLabelSelector,
              label: t('Using resource label selector'),
              description: t(
                'Protect all Kubernetes resources that use the selected resource label selector'
              ),
              onChange,
              body: objectProtectionMethod ===
                ObjectProtectionMethod.ResourceLabelSelector && (
                <LazyLabelExpressionSelector
                  addString={t('Add another resource label selector')}
                  onChange={(expression) => {
                    dispatch({
                      type: ManagePolicyStateType.SET_APP_RESOURCE_SELECTOR,
                      context: ModalViewContext.ASSIGN_POLICY_VIEW,
                      payload: expression,
                    });
                  }}
                  preSelected={appResourceSelector}
                  options={options}
                  isValidationEnabled={isValidationEnabled}
                />
              ),
            },
            {
              className: 'mco-manage-policies__radio--margin-top',
              id: ObjectProtectionMethod.Recipe,
              name: ObjectProtectionMethod.Recipe,
              value: ObjectProtectionMethod.Recipe,
              label: t('Using recipes'),
              description: t(
                'Protect Kubernetes resources as per rules or in the order defined within the recipe'
              ),
              onChange,
              body: objectProtectionMethod ===
                ObjectProtectionMethod.Recipe && (
                <RecipeSelector
                  workLoadNamespace={workLoadNamespace}
                  recipeInfo={recipeInfo}
                  isValidationEnabled={isValidationEnabled}
                  dispatch={dispatch}
                />
              ),
            },
          ]}
        />
        <ReplicationInterval
          captureInterval={captureInterval}
          dispatch={dispatch}
        />
      </>
    );
  };

type DynamicObjectWizardContentProps = {
  workLoadNamespace: string;
  dynamicObjects: DynamicObjectType;
  isValidationEnabled: boolean;
  dispatch: React.Dispatch<ManagePolicyStateAction>;
};

type ReplicationIntervalProps = {
  captureInterval: string;
  dispatch: React.Dispatch<ManagePolicyStateAction>;
};
