import { K8sResourceCommon } from "@openshift-console/dynamic-plugin-sdk";

export type Conditions = {
    status: string
    message: string
}

export type MultiClusterObservability = K8sResourceCommon & {
    spec: {};
    status?: {
        conditions: Conditions[]
    };
}
