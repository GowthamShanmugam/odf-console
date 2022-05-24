import * as React from 'react';
import { Modal, Button } from '@patternfly/react-core';
import * as ReactDOM from 'react-dom';
import * as ModalNew from 'react-modal';

const DemoModal: React.FC<any> = ({close}) => {                                                
    return (
        <Modal
          title="Custom Extention Demo Modal"
          isOpen={true}
          onClose={close}
          variant={"small"}
          actions={[
            <Button key="confirm" variant="primary" onClick={close}>
              Confirm
            </Button>,
            <Button key="cancel" variant="link" onClick={close}>
              Cancel
            </Button>
          ]}
        >
          This modal is injucted from the odf-multicluster-console plugin.
        </Modal>
    );
};

export const createModalLauncher = () => () => {
  const getModalContainer = (onClose) => {
    const _handleClose = (e: React.SyntheticEvent) => {
      onClose && onClose(e);
    };
    return (
      <DemoModal close={_handleClose}/>
    )
  }

  return createModal(getModalContainer);
};

export const createModal = (getModalContainer) => {
  const modalContainer = document.getElementById('modal-container');
  const result = new Promise<void>((resolve) => {
    const closeModal = (e?: React.SyntheticEvent) => {
      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
      ReactDOM.unmountComponentAtNode(modalContainer);
      resolve();
    };
    ModalNew.setAppElement(document.getElementById('app-content'));
    modalContainer && ReactDOM.render(getModalContainer(closeModal), modalContainer);
  });
  return { result };
};


export const demoModal = createModalLauncher();
