import * as React from 'react';
import { DRApplication, PLACEMENT_REF_LABEL } from '@odf/mco/constants';
import {
  getPlacementDecisionsResourceObj,
  getPlacementResourceObj,
  useArgoApplicationSetResourceWatch,
  useDisasterRecoveryResourceWatch,
  ArgoApplicationWatchResources,
} from '@odf/mco/hooks';
import { ArgoApplicationSetKind } from '@odf/mco/types';
import {
  findPlacementNameFromAppSet,
  getRemoteNamespaceFromAppSet,
  findDeploymentClusters,
} from '@odf/mco/utils';
import { getName, getNamespace } from '@odf/shared/selectors';
import * as _ from 'lodash-es';
import { AppManagePoliciesModal } from '../app-manage-policies-modal';
import {
  generateApplicationInfo,
  generateDRPlacementControlInfo,
  generateDRInfo,
  generatePlacementInfo,
  getMatchingDRPolicies,
  getDRResources,
} from '../utils/parser-utils';
import {
  ApplicationInfoType,
  ApplicationType,
  DRPlacementControlType,
  DRPolicyType,
} from '../utils/types';

const getApplicationSetResources = (
  appResource: ArgoApplicationSetKind,
  namespace: string,
  placementName: string,
) => ({
  resources: {
    placements: getPlacementResourceObj({
      name: placementName,
      namespace: namespace,
    }),
    placementDecisions: getPlacementDecisionsResourceObj({
      namespace: namespace,
      selector: { matchLabels: { [PLACEMENT_REF_LABEL]: placementName } },
    }),
  },
  overrides: {
    applications: {
      data: appResource,
      loaded: true,
      loadError: '',
    },
    managedClusters: {
      data: {},
      loaded: true,
      loadError: '',
    },
  },
});

export const ApplicationSetParser: React.FC<ApplicationSetParserProps> = ({
  application,
  isOpen,
  close,
}) => {
  const namespace = getNamespace(application);
  return (
    <_ApplicationSetParser
      applicationDisplayName={getName(application)}
      namespace={namespace}
      watchResource={getApplicationSetResources(
        application,
        namespace,
        findPlacementNameFromAppSet(application),
      )}
      isOpen={isOpen}
      close={close}
    />
  );
};

export const _ApplicationSetParser: React.FC<_ApplicationSetParserProps> = ({
  namespace,
  watchResource,
  isOpen,
  close,
}) => {
   // DR resource watch
   const [drResources, drLoaded, drLoadError] = useDisasterRecoveryResourceWatch(
    getDRResources(namespace)
  );

  const [appSetResources, loaded, loadError] =
    useArgoApplicationSetResourceWatch({
      ...watchResource,
      drResources: {
        data: drResources,
        loaded: drLoaded,
        loadError: drLoadError,
      }
    });
  const { drPolicies } = drResources
  const appSetResource = appSetResources?.formattedResources?.[0];
  const { application } = appSetResource;
  const applicationInfo: ApplicationInfoType = React.useMemo(() => {
    let applicationInfo: ApplicationInfoType = {};
    if (loaded && !loadError) {
      // Today appset support maximum one placement, DRPC, DRPolicy per app.
      // When it support multi placement, need to change logic to,
      // group all DRPC using DRPolicy
      const { placement, placementDecision, drPlacementControl, drPolicy } =
        appSetResource.placements[0];

      const placementInfo = generatePlacementInfo(
        placement,
        findDeploymentClusters(placementDecision, drPlacementControl)
      );
      const drpcInfo: DRPlacementControlType[] = generateDRPlacementControlInfo(
        drPlacementControl,
        placementInfo
      );
      applicationInfo = generateApplicationInfo(
        DRApplication.APPSET,
        application,
        getRemoteNamespaceFromAppSet(application),
        // Skip placement if it already DR protected
        _.isEmpty(drpcInfo) ? [placementInfo] : [],
        generateDRInfo(drPolicy, drpcInfo)
      );
    }
    return applicationInfo;
  }, [application, appSetResource, loaded, loadError]);

  const matchingPolicies: DRPolicyType[] = React.useMemo(
    () =>
      !_.isEmpty(applicationInfo)
        ? getMatchingDRPolicies(applicationInfo as ApplicationType, drPolicies)
        : [],
    [applicationInfo, drPolicies]
  );

  return (
    <AppManagePoliciesModal
      applicaitonInfo={applicationInfo as ApplicationType}
      matchingPolicies={matchingPolicies}
      loaded={loaded}
      loadError={loadError}
      isOpen={isOpen}
      close={close}
    />
  );
};

type ApplicationSetParserProps = {
  application: ArgoApplicationSetKind;
  isOpen: boolean;
  close: () => void;
};

type _ApplicationSetParserProps = {
  applicationDisplayName: string;
  namespace: string;
  isOpen: boolean;
  close: () => void;
  watchResource: ArgoApplicationWatchResources;
};
