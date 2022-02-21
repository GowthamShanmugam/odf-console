import { K8sKind } from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';

export const DRPolicyModel: K8sKind = {
    label: 'DR Policy',
    labelPlural: 'DR Policies',
    apiVersion: 'v1alpha1',
    apiGroup: 'ramendr.openshift.io',
    plural: 'drpolicies',
    abbr: 'DRP',
    namespaced: true,
    kind: 'DRPolicy',
    id: 'drpolicy',
    crd: true,
};
