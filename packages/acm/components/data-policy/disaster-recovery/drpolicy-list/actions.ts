import { TFunction } from 'i18next';

import { DRPolicyKind } from '../../../types';
import { Kebab } from '@openshift-console/dynamic-plugin-sdk-internal-kubevirt';
import { applyPolicyModal } from './apply-policy-modal'

const getGenericActions = () => [...Kebab.factory.common];


const addStorage = (kind, resource: DRPolicyKind, _, customData) => {
    const t: TFunction = customData?.tFunction;
    return {
        labelKey: t('plugin__odf-console~Apply Policy'),
        callback: () => applyPolicyModal({ drPolicy: resource }),
    };
};

export const getActions = (kind: string) => {
    return [...getGenericActions(), addStorage];
};
