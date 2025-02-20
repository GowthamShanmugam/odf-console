import * as React from 'react';
import { DISCOVERED_APP_NS, DRApplication } from '@odf/mco/constants';
import {
  getDRPlacementControlResourceObj,
  getDRPolicyResourceObj,
} from '@odf/mco/hooks';
import { ModalContextViewer } from '../modal-context-viewer';
import {
  findDRPCUsingVM,
  generateApplicationInfo,
  generateDRInfo,
  generateDRPlacementControlInfo,
  generatePlacementInfo,
  getMatchingDRPolicies,
} from '../utils/parser-utils';
import { ModalViewContext } from '../utils/reducer';
import {
  ApplicationInfoType,
  ApplicationType,
  DRPlacementControlType,
  DRPolicyType,
  PVCQueryFilter,
} from '../utils/types';
import {
  K8sResourceCommon,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { DRPlacementControlKind, DRPolicyKind } from '@odf/mco/types';
import { getName, getNamespace } from '@odf/shared';
import { getPlacementKindObj } from '@odf/mco/components/discovered-application-wizard/utils/k8s-utils';
import { findDRPolicyUsingDRPC } from '@odf/mco/utils';

export const DiscoveredParser: React.FC<DiscoveredParserProps> = ({
  virtualMachine,
  cluster,
  pvcQueryFilter,
  setCurrentModalContext,
}) => {
  const [drpcs, drpcsLoaded, drpcsLoadError] = useK8sWatchResource<
    DRPlacementControlKind[]
  >(getDRPlacementControlResourceObj({ namespace: DISCOVERED_APP_NS }));

  const [drPolicies, drPoliciesLoaded, drPoliciesLoadError] =
    useK8sWatchResource<DRPolicyKind[]>(getDRPolicyResourceObj());

  const isLoaded = drpcsLoaded && drPoliciesLoaded;
  const loadError = drpcsLoadError || drPoliciesLoadError;
  const isDataReady = isLoaded && !loadError;

  const applicationInfo: ApplicationInfoType = React.useMemo(() => {
    if (!isDataReady) return {};

    const vmName = getName(virtualMachine);
    const vmNamespace = getNamespace(virtualMachine);
    const drpc = findDRPCUsingVM(drpcs, vmName, vmNamespace);
    const drPolicy = findDRPolicyUsingDRPC(drpc, drPolicies);

    const placementName = drpc?.spec.placementRef.name ?? `${vmName}-placement-1`;
    const placementInfo = generatePlacementInfo(getPlacementKindObj(placementName), [cluster]);
    const drpcInfo: DRPlacementControlType[] = generateDRPlacementControlInfo(drpc, placementInfo);

    return generateApplicationInfo(
      DRApplication.DISCOVERED,
      virtualMachine,
      vmNamespace,
      drpcInfo.length ? [] : [placementInfo], // Skip placement if DR protected
      generateDRInfo(drPolicy, drpcInfo),
      pvcQueryFilter
    );
  }, [virtualMachine, cluster, drpcs, drPolicies, isDataReady]);

  const matchingPolicies: DRPolicyType[] = React.useMemo(
    () => (Object.keys(applicationInfo).length ? getMatchingDRPolicies(applicationInfo as ApplicationType, drPolicies) : []),
    [applicationInfo, drPolicies]
  );

  return (
    <ModalContextViewer
      applicationInfo={applicationInfo}
      matchingPolicies={matchingPolicies}
      loaded={isLoaded}
      loadError={loadError}
      setCurrentModalContext={setCurrentModalContext}
    />
  );
};

type DiscoveredParserProps = {
  virtualMachine: K8sResourceCommon;
  cluster: string;
  setCurrentModalContext: React.Dispatch<React.SetStateAction<ModalViewContext>>;
  pvcQueryFilter?: PVCQueryFilter;
};
