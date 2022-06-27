import * as React from 'react';
import { ButtonBar } from '@odf/shared/generic/ButtonBar';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { useFlag } from '@openshift-console/dynamic-plugin-sdk';
import { ActionGroup, Button } from '@patternfly/react-core';
import { OCS_POOL_MANAGEMENT } from '../constants';
import { BlockPoolState } from './reducer';
import './create-block-pool.scss';

export const checkRequiredValues = (
  poolName: string,
  replicaSize: string,
  volumeType: string,
  isPoolManagementSupported: boolean
): boolean =>
  !poolName || !replicaSize || (isPoolManagementSupported && !volumeType);

export const BlockPoolFooter = (props: BlockPoolFooterProps) => {
  const { state, cancel, onConfirm } = props;
  const { t } = useCustomTranslation();
  const isPoolManagementSupported = useFlag(OCS_POOL_MANAGEMENT);

  return (
    <ButtonBar errorMessage={state.errorMessage} inProgress={state.inProgress}>
      <ActionGroup className="pf-c-form pf-c-form__actions--left">
        <Button
          type="button"
          variant="primary"
          data-test-id="confirm-action"
          onClick={onConfirm}
          isDisabled={checkRequiredValues(
            state.poolName,
            state.replicaSize,
            state.volumeType,
            isPoolManagementSupported
          )}
        >
          {t('Create')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          data-test-id="cancel-action"
          onClick={cancel}
        >
          {t('Cancel')}
        </Button>
      </ActionGroup>
    </ButtonBar>
  );
};

type BlockPoolFooterProps = {
  state: BlockPoolState;
  cancel: () => void;
  onConfirm: () => void;
};
