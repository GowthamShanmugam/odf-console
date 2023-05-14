import * as React from 'react';
import { getName, getNamespace } from '@odf/shared/selectors';
import { DRPolicyKind, DRClusterKind, DRPlacementControlKind } from '../types';
import { filerDRClustersUsingDRPolicy, findDRPolicyUsingDRPC, findDRType, isDRPCAvailable, isPeerReady } from '../utils';
import { DRActionType, DRPC_STATUS, REPLICATION_TYPE } from '../constants';
import { DRClusterStatus } from '../components/modals/app-failover-relocate/subscriptions/target-cluster-selector';

const getDRClusterInfo = (drClusterInfo: DRClusterKind[]): DRClusterInfo[] => 
    drClusterInfo?.map((drClusterInfo) => ({
        clusterName: getName(drClusterInfo),
        clusterNamespace: getNamespace(drClusterInfo),
        status: drClusterInfo?.status?.phase as DRClusterStatus,
    }));

export const useDisasterRecoveryParser: UseDisasterRecoveryParser =
  (props) => {
    const {drClusters, drPlacementControls, drPolicies, loaded, loadError} = props;

    return React.useMemo(() => {
      let disasterRecoveryInfo: DisasterRecoveryInfo[] = [];
      if (loaded && !loadError) {
        drPlacementControls.forEach((drpc) => {
          const drPolicy = findDRPolicyUsingDRPC(drpc, drPolicies);
          const filtereDRClusters = filerDRClustersUsingDRPolicy(
            drPolicy,
            drClusters
          );
          disasterRecoveryInfo.push({
            drpcName: getName(drpc),
            drpcNamespce: getNamespace(drpc),
            failoverCluster: drpc?.spec?.failoverCluster,
            preferedCluster: drpc?.spec?.preferredCluster,
            action: drpc?.spec?.action,
            policyInfo: !!drPolicy && {
                policyKind: drPolicy?.kind,
                policyName: getName(drPolicy),
                replicationType: findDRType(filtereDRClusters),
            },
            status: {
                isPeerReady: isPeerReady(drpc),
                isDRPCAvailable: isDRPCAvailable(drpc),
                phase: drpc?.status?.phase as DRPC_STATUS,
                snapshotTakenTime: drpc?.status?.lastGroupSyncTime,
            },
            drClusterInfo: !!filtereDRClusters && getDRClusterInfo(filtereDRClusters),
          })
        });
      }
      return disasterRecoveryInfo;
    }, [drPolicies, drClusters, drPlacementControls, loaded, loadError]);
  };

type DRResourceParserType = {
    drPlacementControls: DRPlacementControlKind[];
    drPolicies?: DRPolicyKind[];
    drClusters?: DRClusterKind[];
    loaded: boolean;
    loadError: boolean;
};
  
export type UseDisasterRecoveryParser = (
  props?: DRResourceParserType
) => DisasterRecoveryInfo[];

type DRClusterInfo =  {
    clusterName: string;
    clusterNamespace: string;
    status: DRClusterStatus;
};

export type DisasterRecoveryInfo = Partial<{
    drpcName: string;
    drpcNamespce: string;
    failoverCluster: string;
    preferedCluster: string;
    action: DRActionType;
    status: {
        isPeerReady: boolean;
        isDRPCAvailable: boolean;
        phase: DRPC_STATUS;
        snapshotTakenTime: string;
    }
    policyInfo: {
      policyName: string;
      policyKind: string;
      replicationType: REPLICATION_TYPE;
    };
    drClusterInfo: DRClusterInfo[];
}>;
