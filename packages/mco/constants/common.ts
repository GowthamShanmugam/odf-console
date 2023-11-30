// Hub operators
export const ODFMCO_OPERATOR = 'odf-multicluster-orchestrator';
export const ODR_HUB_OPERATOR = 'odr-hub-operator';

// Hub operator namespace
export const ODFMCO_OPERATOR_NAMESPACE = 'openshift-operators';

// Cluster operatos
export const ODR_CLUSTER_OPERATOR = 'odr-cluster-operator';
export const VOL_SYNC = 'volsync';

// Hub cluster context
export const HUB_CLUSTER_NAME = 'local-cluster';

// Feature config
export const SECOND = 1000;
export const DEFAULT_SYNC_TIME = 15;
export const ACM_OBSERVABILITY_FLAG = 'ACM_OBSERVABILITY';
export const ADMIN_FLAG = 'ADMIN';

// Types of storage
export enum STORAGE_TYPE {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
}

// ODF cluster config MCV label selector
export const ODF_CONFIG_MCV_REF_LABEL =
  'multicluster.odf.openshift.io/odf-config';
