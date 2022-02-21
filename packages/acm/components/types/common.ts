import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

export type DataSet = {
    name: string,
    region: string,
    s3ProfileName: string
}

export type DRPolicyKind = K8sResourceCommon & {
    spec: {
        drClusterSet: DataSet[]
    };
    status: {
        phase: string;
    }
};
