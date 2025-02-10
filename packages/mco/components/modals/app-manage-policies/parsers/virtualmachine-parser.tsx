import * as React from 'react';
import * as _ from 'lodash-es';
import { SearchResultItemType, VirtualMachineKind } from '@odf/mco/types';
import { queryVMManagedAppResourcesFromHub } from '@odf/mco/utils';
import { getName, getNamespace } from '@odf/shared';
import {
  getApplicationSetResourceObj,
  getPlacementDecisionsResourceObj,
  getPlacementResourceObj,
  useACMSafeFetch,
} from '@odf/mco/hooks';
import { _ApplicationSetParser } from './application-set-parser';

const getApplicationSetResources = (
  applicationName: string,
  placementName: string,
  placementDecisionName: string,
  namespace: string,
) => ({
  resources: {
    applications: getApplicationSetResourceObj({
      name: applicationName,
      namespace: namespace,
    }),
    placements: getPlacementResourceObj({
      name: placementName,
      namespace: namespace,
    }),
    placementDecisions: getPlacementDecisionsResourceObj({
      name: placementDecisionName,
      namespace: namespace,
    }),
  },
  overrides: {
    managedClusters: {
      data: {},
      loaded: true,
      loadError: '',
    },
  },
});

export const VirtualMachineParser: React.FC<VirtualMachineParserProps> = ({
  virtualMachine,
  isOpen,
  close,
}) => {
  const virtualMachineName = getName(virtualMachine) || virtualMachine?.name;
  const virtualMachineNamespace =
    getNamespace(virtualMachine) || virtualMachine?.namespace;
  
  // ACM search proxy api call
  const searchQuery = React.useMemo(
    () =>
      queryVMManagedAppResourcesFromHub(
        virtualMachineName,
        virtualMachineNamespace
      ),
    [virtualMachine]
  );
  const [searchResult] = useACMSafeFetch(searchQuery);
  const application = React.useMemo(() => {
    const app: SearchResultItemType =
      searchResult?.data.searchResult?.[0]?.items?.[0];
  }, [searchResult]);


  return (
    <_ApplicationSetParser
      applicationDisplayName={virtualMachineName}
      namespace={virtualMachineNamespace}
      watchResource={getApplicationSetResources(
        applicationName,
        virtualMachineNamespace,
        placementName,
        placementDecisionName,
      )}
      isOpen={isOpen}
      close={close}
    />
  );
};

type VirtualMachineParserProps = {
  virtualMachine: VirtualMachineKind;
  isOpen: boolean;
  close: () => void;
};
