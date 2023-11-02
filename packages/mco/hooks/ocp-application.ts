import * as React from 'react';
import { getName, getNamespace } from '@odf/shared/selectors';
import {
  useK8sWatchResources,
  WatchK8sResource,
  WatchK8sResultsObject,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  ACMManagedClusterKind,
  DRPlacementControlKind,
  DRPolicyKind,
  DRClusterKind,
  OCPApplicationKind,
} from '../types';
import {
  findDRResourceUsingPlacement,
  filerManagedClusterUsingDRClusters,
} from '../utils';
import { DisasterRecoveryResourceKind } from './disaster-recovery';
import {
  getApplicationResourceObj,
  getManagedClusterResourceObj,
} from './mco-resources';
import { ODFMCO_OPERATOR_NAMESPACE } from '../constants';
import { ApplicationKind } from '@odf/shared/types';

export const applicationResouceObj = getApplicationResourceObj({
  selector: {
    matchExpressions: [
      {
        key: 'app.kubernetes.io/part-of',
        operator: 'Exists',
      },
      {
        key: 'app',
        operator: 'Exists',
      },
    ],
  },
  namespace: ODFMCO_OPERATOR_NAMESPACE,
});

const getResources = () => ({
  managedClusters: getManagedClusterResourceObj(),
  applications: applicationResouceObj,
});

// TODO: This logic is still under discussion
const isReferenceOfOCPApplication = (
  ocpApplication: OCPApplicationKind,
  application: ApplicationKind
) => false;

export const useOCPApplicationWatch: UseOCPApplicationWatch = (resource) => {
  const response = useK8sWatchResources<WatchResourceType>(
    resource?.resources || getResources()
  );

  const {
    data: applications,
    loaded: applicationsLoaded,
    loadError: applicationsLoadError,
  } = response?.applications || resource?.overrides?.applications || {};

  const {
    data: managedClusters,
    loaded: managedClustersLoaded,
    loadError: managedClustersLoadedError,
  } = response?.managedClusters || resource?.overrides?.managedClusters || {};

  const {
    data: drResources,
    loaded: drLoaded,
    loadError: drLoadError,
  } = resource?.drResources || {};

  const ocpApplication = resource?.ocpApplication;

  const loaded = applicationsLoaded && managedClustersLoaded && drLoaded;

  const loadError =
    applicationsLoadError || managedClustersLoadedError || drLoadError;

  return React.useMemo(() => {
    let ocpAppResources: OCPAppResourceKind = {};
    const ocpApplicationFormatted: OCPApplicationFormattedKind[] = [];
    if (loaded && !loadError) {
      const appList = Array.isArray(applications)
        ? applications
        : [applications];
      const managedClusterList = Array.isArray(managedClusters)
        ? managedClusters
        : [managedClusters];
      appList.forEach((application) => {
        if (
          !ocpApplication ||
          isReferenceOfOCPApplication(ocpApplication, application)
        ) {
          // Application kind is the placement for OCP application
          const drResource = findDRResourceUsingPlacement(
            getName(application),
            getNamespace(application),
            drResources?.formattedResources
          );
          ocpApplicationFormatted.push({
            application,
            ...drResource,
            managedClusters: filerManagedClusterUsingDRClusters(
              drResource?.drClusters,
              managedClusterList
            ),
          });
        }
      });
      ocpAppResources = {
        formattedResources: ocpApplicationFormatted,
        managedClusters: managedClusterList,
      };
    }

    return [ocpAppResources, loaded, loadError];
  }, [
    applications,
    drResources,
    managedClusters,
    ocpApplication,
    loaded,
    loadError,
  ]);
};

type WatchResourceType = {
  applications?: ApplicationKind | ApplicationKind[];
  managedClusters?: ACMManagedClusterKind | ACMManagedClusterKind[];
};

type WatchResources = {
  resources?: {
    applications?: WatchK8sResource;
    managedClusters?: WatchK8sResource;
  };
  overrides?: {
    applications?: WatchK8sResultsObject<ApplicationKind>;
    managedClusters?: WatchK8sResultsObject<ACMManagedClusterKind>;
  };
  ocpApplication?: OCPApplicationKind;
  drResources?: {
    data: DisasterRecoveryResourceKind;
    loaded: boolean;
    loadError: any;
  };
};

export type UseOCPApplicationWatch = (
  resource?: WatchResources
) => [OCPAppResourceKind, boolean, any];

export type OCPApplicationFormattedKind = {
  application: ApplicationKind;
  drPlacementControl?: DRPlacementControlKind;
  drPolicy?: DRPolicyKind;
  drClusters?: DRClusterKind[];
  managedClusters?: ACMManagedClusterKind[];
};

export type OCPAppResourceKind = {
  formattedResources?: OCPApplicationFormattedKind[];
  managedClusters?: ACMManagedClusterKind[];
};
