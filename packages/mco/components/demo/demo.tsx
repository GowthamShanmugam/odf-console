export const launchClusterExpansionModal = async () => {
    try {
      const modal = await import(
        './demo-modal' /* webpackChunkName: "ceph-storage-add-capacity-modal" */
      );
      modal.demoModal();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Error launching modal', e);
    }
  };
