import { TFunction } from 'i18next';

export const ODF_MINIMUM_SUPPORT = '4.11.0';
export const ODF_OPERATOR_SUBSCRIPTION_NAME = 'odf-operator';
export const STORAGE_SYSTEM_INTERNAL_NAME = 'ocs-storagecluster-storagesystem';
export const STORAGE_SYSTEM_EXTERNAL_NAME =
  'ocs-external-storagecluster-storagesystem';
export const CEPH_INTERNAL_CLUSTER_NAME = 'ocs-storagecluster-cephcluster';
export const CEPH_EXTERNAL_CLUSTER_NAME =
  'ocs-external-storagecluster-cephcluster';
export const MANAGED_CLUSTER_REGION_CLAIM = 'region.open-cluster-management.io';
export const ODF_OPERATOR_SUBSCRIPTION_VIEW_NAME = `${ODF_OPERATOR_SUBSCRIPTION_NAME}-view`;
export const STORAGE_SYSTEM_INTERNAL_VIEW_NAME = `${STORAGE_SYSTEM_INTERNAL_NAME}-view`;
export const STORAGE_SYSTEM_EXTERNAL_VIEW_NAME = `${STORAGE_SYSTEM_EXTERNAL_NAME}-view`;
export const CEPH_INTERNAL_CLUSTER_VIEW_NAME = `${CEPH_INTERNAL_CLUSTER_NAME}-view`;
export const CEPH_EXTERNAL_CLUSTER_VIEW_NAME = `${CEPH_EXTERNAL_CLUSTER_NAME}-view`;
export const MAX_ALLOWED_CLUSTERS = 2;
export const DR_SECHEDULER_NAME = 'ramen';

export const REPLICATION_TYPE = (t: TFunction) => ({
  async: t('Asynchronous'),
  sync: t('Synchronous'),
});

export const Actions = (t: TFunction) => ({
  APPLY_DR_POLICY: t('plugin__odf-console~Apply DRPolicy'),
  DELETE_DR_POLICY: t('plugin__odf-console~Delete DRPolicy'),
});
