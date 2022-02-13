import { K8sKind } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const AcmMultiClusterObservabilityModel: K8sKind = {
  label: 'multiclusterobservability',
  labelPlural: 'multiclusterobservabilities',
  apiVersion: 'v1beta2',
  apiGroup: 'observability.open-cluster-management.io',
  plural: 'multiclusterobservabilities',
  abbr: 'mco',
  namespaced: false,
  kind: 'MultiClusterObservability',
  id: 'observability',
  crd: true,
};

export const ConfigMapModel: K8sKind = {
  apiVersion: 'v1',
  label: 'ConfigMap',
  // t('public~ConfigMap')
  labelKey: 'public~ConfigMap',
  plural: 'configmaps',
  abbr: 'CM',
  namespaced: true,
  kind: 'ConfigMap',
  id: 'configmap',
  labelPlural: 'ConfigMaps',
  // t('public~ConfigMaps')
  labelPluralKey: 'public~ConfigMaps',
};
