import * as React from 'react';
import {
  daysToSeconds,
  hoursToSeconds,
  minutesToSeconds,
} from '@odf/shared/details-page/datetime';
import {
  getLabel,
  hasLabel,
  getName,
  getNamespace,
} from '@odf/shared/selectors';
import { ApplicationKind } from '@odf/shared/types/k8s';
import {
  K8sResourceCommon,
  ObjectReference,
  GreenCheckCircleIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Operator,
  MatchExpression,
} from '@openshift-console/dynamic-plugin-sdk/lib/api/common-types';
import { TFunction } from 'i18next';
import { InProgressIcon, UnknownIcon } from '@patternfly/react-icons';
import { SLA_STATUS, DR_SECHEDULER_NAME, DRPC_STATUS } from '../constants';
import { REPLICATION_TYPE, TIME_UNITS } from '../constants/disaster-recovery';
import { DisasterRecoveryFormatted } from '../hooks';
import {
  ACMPlacementModel,
  ACMPlacementRuleModel,
  DRPolicyModel,
  DRVolumeReplicationGroup,
} from '../models';
import {
  ACMSubscriptionKind,
  ACMPlacementRuleKind,
  DRPlacementControlKind,
  DRPolicyKind,
  DRClusterKind,
  ACMManagedClusterKind,
  ArgoApplicationSetKind,
  ACMManagedClusterViewKind,
  DRVolumeReplicationGroupKind,
  ProtectedPVCData,
  ProtectedAppSetsMap,
} from '../types';

export type PlacementRuleMap = {
  [placementRuleName: string]: string;
};

export type SubscriptionMap = {
  [placementRuleName: string]: string[];
};

export type ApplicationDRInfo = {
  drPolicyControl: DRPlacementControlKind;
  subscriptions: string[];
  clusterName: string; // current placement cluster
};

export type DRPolicyMap = {
  [policyName: string]: DRPlacementControlKind[];
};

export const isMinimumSupportedODFVersion = (
  odfVersion: string,
  requiredODFVersion: string
): boolean =>
  odfVersion.localeCompare(requiredODFVersion, undefined, {
    numeric: true,
    sensitivity: 'base',
  }) >= 0;

const isSubscriptionInApplication = (
  subscription: ACMSubscriptionKind,
  expr: MatchExpression,
  match: Boolean
) =>
  match
    ? expr?.values?.includes(getLabel(subscription, expr?.key))
    : !expr?.values?.includes(getLabel(subscription, expr?.key));

const isApplicationInSubscription = (
  subscription: ACMSubscriptionKind,
  expr: MatchExpression,
  match: Boolean
) =>
  match
    ? hasLabel(subscription?.metadata?.labels, expr?.key) &&
      !Array.isArray(expr?.values)
    : !hasLabel(subscription?.metadata?.labels, expr?.key) &&
      !Array.isArray(expr?.values);

export const matchApplicationToSubscription = (
  subscription: ACMSubscriptionKind,
  application: ApplicationKind
): boolean => {
  // applying subscription filter from application
  const valid = application?.spec?.selector?.matchExpressions?.every((expr) => {
    switch (expr?.operator) {
      case Operator.In:
        return isSubscriptionInApplication(subscription, expr, true);
      case Operator.NotIn:
        return isSubscriptionInApplication(subscription, expr, false);
      case Operator.Exists:
        return isApplicationInSubscription(subscription, expr, true);
      case Operator.DoesNotExist:
        return isApplicationInSubscription(subscription, expr, false);
        break;
      default:
        return false;
    }
  });
  return valid;
};

export const isObjectRefMatching = (
  objectRef: ObjectReference,
  objectRefList: string[]
): boolean => objectRefList?.includes(objectRef?.name);

export const filterDRPlacementRuleNames = (
  placementRules: ACMPlacementRuleKind[]
): PlacementRuleMap =>
  placementRules?.reduce(
    (acc, placementRule) =>
      placementRule?.spec?.schedulerName === DR_SECHEDULER_NAME
        ? {
            ...acc,
            [getName(placementRule)]:
              placementRule?.status?.decisions?.[0].clusterName || '',
          }
        : acc,
    {}
  );

export const isPlacementRuleModel = (subscription: ACMSubscriptionKind) =>
  getPlacementKind(subscription) === ACMPlacementRuleModel?.kind;

export const filterDRSubscriptions = (
  application: ApplicationKind,
  subscriptions: ACMSubscriptionKind[],
  placementRuleMap: PlacementRuleMap
): SubscriptionMap =>
  subscriptions?.reduce((acc, subscription) => {
    const placementRuleName = subscription?.spec?.placement?.placementRef?.name;
    const subsMap =
      isPlacementRuleModel(subscription) &&
      isObjectRefMatching(
        subscription?.spec?.placement?.placementRef,
        Object.keys(placementRuleMap) || []
      ) &&
      matchApplicationToSubscription(subscription, application)
        ? {
            ...acc,
            [placementRuleName]: [
              ...(acc[placementRuleName] || []),
              getName(subscription),
            ],
          }
        : acc;
    return subsMap;
  }, {});

export const getAppDRInfo = (
  drPlacementControls: DRPlacementControlKind[],
  subscriptionMap: SubscriptionMap,
  placementRuleMap: PlacementRuleMap
): ApplicationDRInfo[] =>
  drPlacementControls?.reduce(
    (acc, drPlacementControl) =>
      isObjectRefMatching(
        drPlacementControl?.spec?.placementRef,
        Object.keys(subscriptionMap)
      )
        ? [
            ...acc,
            {
              drPolicyControl: drPlacementControl,
              subscriptions:
                subscriptionMap?.[drPlacementControl?.spec?.placementRef?.name],
              clusterName: getPlacementClusterName(
                placementRuleMap,
                drPlacementControl
              ),
            },
          ]
        : acc,
    []
  );

export const getPlacementClusterName = (
  placementRuleMap: PlacementRuleMap,
  drpc: DRPlacementControlKind
) => placementRuleMap?.[drpc?.spec?.placementRef?.name] || '';

export const getDRPolicyName = (drpc: DRPlacementControlKind) =>
  drpc?.spec?.drPolicyRef?.name;

export const getDRPoliciesCount = (drPolicies: DRPolicyMap) =>
  Object.keys(drPolicies || {})?.length;

export const getReplicationType = (schedulingInterval: string) =>
  schedulingInterval !== '0m' ? REPLICATION_TYPE.ASYNC : REPLICATION_TYPE.SYNC;

export const getPlacementKind = (subscription: ACMSubscriptionKind) =>
  subscription?.spec?.placement?.placementRef?.kind;

export const isPeerReadyAndAvailable = (
  drPolicyControl: DRPlacementControlKind
) => {
  let isPeerReady = false;
  let isAvailable = false;
  drPolicyControl?.status?.conditions?.forEach((condition) => {
    condition?.type === 'PeerReady' &&
      condition?.status === 'True' &&
      (isPeerReady = true);
    condition?.type === 'Available' &&
      condition?.status === 'True' &&
      (isAvailable = true);
  });
  return isPeerReady && isAvailable;
};

export const findCluster = (
  clusters: K8sResourceCommon[],
  deploymentClusterName: string,
  isDeploymentCluster = false
) =>
  clusters?.find((cluster) =>
    isDeploymentCluster
      ? getName(cluster) === deploymentClusterName
      : getName(cluster) !== deploymentClusterName
  );

export const findDRType = (drClusters: DRClusterKind[]) =>
  drClusters?.every(
    (drCluster) => drCluster?.spec?.region === drClusters?.[0]?.spec?.region
  )
    ? REPLICATION_TYPE.SYNC
    : REPLICATION_TYPE.ASYNC;

export const findDRResourceUsingPlacement = (
  placementName: string,
  workloadNamespace: string,
  drResources: DisasterRecoveryFormatted[]
): DisasterRecoveryFormatted => {
  let result: DisasterRecoveryFormatted = {};
  drResources?.forEach((drResource) => {
    const drpc = drResource?.drPlacementControls?.find((drpc) => {
      const placementRef = drpc.spec?.placementRef;
      return (
        placementRef?.kind === ACMPlacementModel.kind &&
        placementRef?.name === placementName &&
        getNamespace(drpc) === workloadNamespace
      );
    });
    if (!!drpc) {
      result = {
        drPolicy: drResource?.drPolicy,
        drClusters: drResource?.drClusters,
        drPlacementControls: [drpc],
      };
      return true;
    }
    return false;
  });
  return result;
};

export const filerManagedClusterUsingDRClusters = (
  drClusters: DRClusterKind[],
  managedClusters: ACMManagedClusterKind[]
) =>
  managedClusters?.filter(
    (managedCluster) =>
      !!drClusters?.find(
        (drCluster) => getName(managedCluster) === getName(drCluster)
      )
  );

export const filerDRClustersUsingDRPolicy = (
  drPolicy: DRPolicyKind,
  drClusters: DRClusterKind[]
) =>
  drClusters?.filter((drCluster) =>
    drPolicy?.spec?.drClusters?.includes(getName(drCluster))
  );

export const findDRPCUsingDRPolicy = (
  drpcs: DRPlacementControlKind[],
  drPolicy: DRPolicyKind
): DRPlacementControlKind[] => {
  return drpcs?.filter(
    (drpc) =>
      drpc?.spec?.drPolicyRef?.name === getName(drPolicy) &&
      drpc?.spec?.drPolicyRef?.kind === DRPolicyModel.kind
  );
};

export const isDRClusterFenced = (cluster: DRClusterKind) =>
  cluster?.status?.phase === 'Fenced';

export const matchClusters = (
  drClusterNames: string[],
  decisionClusters: string[]
): string =>
  drClusterNames?.find((drClusterName: string) =>
    decisionClusters?.includes(drClusterName)
  );

export const parseSyncInterval = (
  scheduledSyncInterval: string
): [TIME_UNITS, number] => {
  const regex = new RegExp(
    `([0-9]+)|([${TIME_UNITS.Days}|${TIME_UNITS.Hours}|${TIME_UNITS.Minutes}]+)`,
    'g'
  );
  const splittedArray = scheduledSyncInterval?.match(regex);
  const interval = Number(splittedArray?.[0] || 0);
  const unit = (splittedArray?.[1] || TIME_UNITS.Minutes) as TIME_UNITS;
  return [unit, interval];
};

export const convertSyncIntervalToSeconds = (
  syncInterval: string
): [number, TIME_UNITS] => {
  const [unit, scheduledSyncTime] = parseSyncInterval(syncInterval);
  const threshold =
    (unit === TIME_UNITS.Days && daysToSeconds(scheduledSyncTime)) ||
    (unit === TIME_UNITS.Hours && hoursToSeconds(scheduledSyncTime)) ||
    (unit === TIME_UNITS.Minutes && minutesToSeconds(scheduledSyncTime));
  return [threshold, unit];
};

const THRESHOLD = 2;

export const getSLAStatus = (
  slaTakenInSeconds: number,
  scheduledSyncInterval: string
): [SLA_STATUS, number] => {
  const currentTimeInSeconds = new Date().getTime() / 1000;
  const timeTakenInSeconds = currentTimeInSeconds - slaTakenInSeconds;
  const [syncIntervalInSeconds] = convertSyncIntervalToSeconds(
    scheduledSyncInterval
  );
  const slaDiff = timeTakenInSeconds / syncIntervalInSeconds || 0;
  if (slaDiff >= THRESHOLD) return [SLA_STATUS.CRITICAL, slaDiff];
  else if (slaDiff > syncIntervalInSeconds && slaDiff < THRESHOLD)
    return [SLA_STATUS.WARNING, slaDiff];
  else return [SLA_STATUS.HEALTHY, slaDiff];
};

export const getRemoteNSFromAppSet = (
  application: ArgoApplicationSetKind
): string => application?.spec?.template?.spec?.destination?.namespace;

export const getProtectedPVCsFromDRPC = (
  drpc: DRPlacementControlKind
): string[] =>
  drpc?.status?.resourceConditions?.resourceMeta?.protectedpvcs || [];

export const getCurrentStatus = (drpcList: DRPlacementControlKind[]): string =>
  drpcList.reduce((prevStatus, drpc) => {
    const newStatus = DRPC_STATUS[drpc?.status?.phase] || '';
    return [DRPC_STATUS.Relocating, DRPC_STATUS.FailingOver].includes(newStatus)
      ? newStatus
      : prevStatus || newStatus;
  }, '');

export const getDRStatus = ({
  currentStatus,
  targetClusters,
  customText,
  t,
}: {
  currentStatus: string;
  targetClusters?: string;
  customText?: string;
  t: TFunction;
}) => {
  switch (currentStatus) {
    case DRPC_STATUS.Relocating:
    case DRPC_STATUS.FailingOver:
      return {
        text: customText || currentStatus,
        icon: <InProgressIcon />,
        toolTip: (
          <>
            <h4>{t('Target cluster')}</h4>
            <p>{t('In use: {{targetClusters}}', { targetClusters })}</p>
          </>
        ),
      };
    case DRPC_STATUS.Relocated:
    case DRPC_STATUS.FailedOver:
      return {
        text: customText || currentStatus,
        icon: <GreenCheckCircleIcon />,
        toolTip: (
          <>
            <h4>{t('Target cluster')}</h4>
            <p>{t('Used: {{targetClusters}}', { targetClusters })}</p>
          </>
        ),
      };
    default:
      return {
        text: t('Unknown'),
        icon: <UnknownIcon />,
        toolTip: t('Unknown'),
      };
  }
};

const filterMulticlusterView = (mcvs: ACMManagedClusterViewKind[]) =>
  mcvs?.filter(
    (mcv) => mcv?.spec?.scope?.resource === DRVolumeReplicationGroup.kind
  );

export const getProtectedPVCFromVRG = (
  mcvs: ACMManagedClusterViewKind[]
): ProtectedPVCData[] => {
  const filteredMCVs = filterMulticlusterView(mcvs);
  return filteredMCVs?.reduce((acc, mcv) => {
    const drpcName =
      mcv?.metadata?.annotations?.[
        'drplacementcontrol.ramendr.openshift.io/drpc-name'
      ];
    const drpcNamespace =
      mcv?.metadata?.annotations?.[
        'drplacementcontrol.ramendr.openshift.io/drpc-namespace'
      ];
    const vrg = mcv?.status?.result as DRVolumeReplicationGroupKind;
    const pvcInfo = vrg?.status?.protectedPVCs?.map((pvc) => ({
      drpcName,
      drpcNamespace,
      pvcName: pvc?.name,
      pvcNamespace: getNamespace(vrg),
      lastSyncTime: pvc?.lastSyncTime,
      schedulingInterval: vrg?.spec?.async?.schedulingInterval,
    }));
    return !!pvcInfo?.length ? [...acc, ...pvcInfo] : acc;
  }, []);
};

export const filterPVCDataUsingAppsets = (
  pvcsData: ProtectedPVCData[],
  protectedAppsets: ProtectedAppSetsMap[]
) =>
  pvcsData?.filter(
    (pvcData) =>
      !!protectedAppsets?.find((appSet) => {
        const placementInfo = appSet?.placementInfo?.[0];
        const result =
          placementInfo?.drpcName === pvcData?.drpcName &&
          placementInfo?.drpcNamespace === pvcData?.drpcNamespace;
        return result;
      })
  );
