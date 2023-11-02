import * as React from 'react';
import { OCPApplicationKind } from '@odf/mco/types';
import { getNamespace } from '@odf/shared/selectors';
import * as _ from 'lodash-es';
import {
  DisasterRecoveryResourceKind,
  getDRClusterResourceObj,
  getDRPlacementControlResourceObj,
  getDRPolicyResourceObj,
  useDisasterRecoveryResourceWatch,
  useOCPApplicationWatch,
  applicationResouceObj,
} from '@odf/mco/hooks';
import {
  ApplicationInfoType,
  ApplicationType,
  DRPlacementControlType,
  DRPolicyType,
  DataPolicyType,
} from '../utils/types';
import {
  generateApplicationInfo,
  generateDRPlacementControlInfo,
  generateDRPolicyInfo,
  generatePlacementInfo,
  getMatchingDRPolicies,
} from '../utils/parser-utils';
import { AppManagePoliciesModal } from '../app-manage-policies-modal';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';

const getDRResources = (namespace: string) => ({
  resources: {
    drPolicies: getDRPolicyResourceObj(),
    drClusters: getDRClusterResourceObj(),
    drPlacementControls: getDRPlacementControlResourceObj({
      namespace: namespace,
    }),
  },
});

const getOCPApplicationResources = (
  ocpApplication: OCPApplicationKind,
  drResources: DisasterRecoveryResourceKind,
  drLoaded: boolean,
  drLoadError: any
) => ({
  resources: {
    applications: applicationResouceObj,
  },
  drResources: {
    data: drResources,
    loaded: drLoaded,
    loadError: drLoadError,
  },
  ocpApplication: ocpApplication,
  overrides: {
    managedClusters: {
      data: {},
      loaded: true,
      loadError: '',
    },
  },
});

export const OCPApplicationParser: React.FC<OCPApplicationParserProps> = ({
  ocpApplication,
  isOpen,
  close,
}) => {
  const { t } = useCustomTranslation();
  const [drResources, drLoaded, drLoadError] = useDisasterRecoveryResourceWatch(
    getDRResources(getNamespace(ocpApplication))
  );
  const [ocpAppResources, loaded, loadError] = useOCPApplicationWatch(
    getOCPApplicationResources(
      ocpApplication,
      drResources,
      drLoaded,
      drLoadError
    )
  );

  const ocpAppResource = ocpAppResources?.formattedResources?.[0];
  const formattedDRResources = drResources?.formattedResources;

  const applicationInfo: ApplicationInfoType = React.useMemo(() => {
    let applicationInfo: ApplicationInfoType = {};
    if (loaded && !loadError) {
      const { application, drPlacementControl, drPolicy, drClusters } =
        ocpAppResource || {};
      const placementInfo = generatePlacementInfo(application, [
        ocpApplication?.status?.cluster,
      ]);
      const drpcInfo: DRPlacementControlType[] = generateDRPlacementControlInfo(
        drPlacementControl,
        placementInfo
      );
      const drPolicyInfo: DRPolicyType[] = generateDRPolicyInfo(
        drPolicy,
        drClusters,
        drpcInfo,
        t
      );
      applicationInfo = generateApplicationInfo(
        ocpApplication,
        ocpApplication.namespace,
        // Skip placement if it already DR protected
        _.isEmpty(drpcInfo) ? [placementInfo] : [],
        drPolicyInfo
      );
    }
    return applicationInfo;
  }, [ocpApplication, ocpAppResource, loaded, loadError, t]);

  const matchingPolicies: DataPolicyType[] = React.useMemo(
    () =>
      !_.isEmpty(applicationInfo)
        ? getMatchingDRPolicies(
            applicationInfo as ApplicationType,
            formattedDRResources
          )
        : [],
    [applicationInfo, formattedDRResources]
  );

  return (
    <AppManagePoliciesModal
      applicaitonInfo={applicationInfo}
      matchingPolicies={matchingPolicies}
      loaded={loaded}
      loadError={loadError}
      isOpen={isOpen}
      close={close}
    />
  );
};

type OCPApplicationParserProps = {
  ocpApplication: OCPApplicationKind;
  isOpen: boolean;
  close: () => void;
};
