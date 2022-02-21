import * as React from 'react';
import {
  ModalTitle,
  ModalBody,
  ModalSubmitFooter,
} from '@odf/shared/generic/ModalTitle';
import {
  useK8sGet,
  createModalLauncher,
} from '@openshift-console/dynamic-plugin-sdk-internal-kubevirt';
import { useTranslation } from 'react-i18next';
import { DRPolicyModel } from '../../../models';
import { DRPolicyKind } from '../../../types';


type ApplyPolicyModalProps = {
  drPolicy: DRPolicyKind;
  close?: () => void;
  cancel?: () => void;
};

const ApplyPolicyModal: React.FC<ApplyPolicyModalProps> = ({
  drPolicy,
  close,
  cancel,
}) => {
  const [drp, drPolicyLoaded, drPolicyError] = useK8sGet<DRPolicyKind>(
    DRPolicyModel,
    drPolicy.metadata.name,
  );
  if (!drPolicyLoaded || drPolicyError) {
    return null;
  }

  return <DrPolicyModal drPolicy={drp} close={close} cancel={cancel} />;
};

const DrPolicyModal = (props: drPolicyModalProps) => {
  const { t } = useTranslation('plugin__odf-console');

  return (
    <form name="form">
      <div className="modal-content modal-content--no-inner-scroll">
        <ModalTitle>{t('Apply Policy')}</ModalTitle>
        <ModalBody>
          <p> {props.drPolicy?.metadata?.name} </p>
        </ModalBody>
        <ModalSubmitFooter
          inProgress={false}
          errorMessage={""}
          submitText={t('Add')}
          cancel={props.cancel}
          submitDisabled={false}
        />
      </div>
    </form>
  );
};

type drPolicyModalProps = {
  kind?: any;
  drPolicy?: any;
  cancel?: () => void;
  close?: () => void;
};

export const applyPolicyModal = createModalLauncher(ApplyPolicyModal);
