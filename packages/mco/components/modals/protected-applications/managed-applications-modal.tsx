import * as React from 'react';
import { StepsCountBadge } from '@odf/shared';
import {
  CommonModalProps,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '@odf/shared/modals/Modal';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  Modal,
  ModalVariant,
  Button,
  ButtonVariant,
} from '@patternfly/react-core';
import { ArrowRightIcon, IconSize } from '@patternfly/react-icons';

const ManagedApplicationsModal: React.FC<CommonModalProps> = (props) => {
  const { t } = useCustomTranslation();
  const navigate = useNavigate();

  const { isOpen, closeModal } = props;

  const Header = (
    <ModalHeader>{t('Enroll ACM managed application')}</ModalHeader>
  );
  return (
    <Modal
      isOpen={isOpen}
      variant={ModalVariant.medium}
      header={Header}
      onClose={closeModal}
    >
      <ModalBody>
        <p className="co-break-word pf-u-mb-md">
          {t(
            'Follow the below steps to enroll your managed applications to disaster recovery:'
          )}
        </p>
        <Trans t={t}>
          <p className="co-break-word pf-u-mb-md">
            <span className="pf-u-mr-sm">
              <StepsCountBadge stepCount={1} />
            </span>{' '}
            Navigate to{' '}
            <span className="pf-u-font-weight-bold">Applications</span> section
            and locate your application.
          </p>

          <p className="co-break-word pf-u-mb-md">
            <span className="pf-u-mr-sm">
              <StepsCountBadge stepCount={2} />
            </span>{' '}
            Select{' '}
            <span className="pf-u-font-weight-bold">
              Manage disaster recovery
            </span>{' '}
            from inline actions.
          </p>

          <p className="co-break-word">
            <span className="pf-u-mr-sm">
              <StepsCountBadge stepCount={3} />
            </span>{' '}
            In the Manage disaster recovery modal, click on{' '}
            <span className="pf-u-font-weight-bold">Enroll application</span> to
            start the wizard process.
          </p>
        </Trans>
      </ModalBody>
      <ModalFooter>
        <Button
          variant={ButtonVariant.link}
          onClick={() => {
            closeModal();
            navigate('/multicloud/applications');
          }}
          isInline
        >
          {t('Continue to Applications page')}
          <ArrowRightIcon size={IconSize.sm} className="pf-u-ml-sm" />
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ManagedApplicationsModal;
