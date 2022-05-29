import * as React from 'react';
import { CEPH_STORAGE_NAMESPACE } from '@odf/shared/constants/common';
import {
  ODFStorageSystem,
  CephClusterModel,
  SubscriptionModel,
} from '@odf/shared/models';
import { K8sResourceKind } from '@odf/shared/types';
import {
  getAPIVersionForModel,
  k8sCreate,
  k8sDelete,
} from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import {
  Text,
  Badge,
  TextContent,
  TextVariants,
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import {
  CREATE_BY_LABEL,
  MCO_PLUGIN_NAME,
  ODF_OPERATOR_SUBSCRIPTION_VIEW_NAME,
  ODF_OPERATOR_SUBSCRIPTION_NAME,
  CEPH_INTERNAL_CLUSTER_VIEW_NAME,
  CEPH_INTERNAL_CLUSTER_NAME,
  STORAGE_SYSTEM_INTERNAL_VIEW_NAME,
  STORAGE_SYSTEM_INTERNAL_NAME,
  HUB_CLUSTER_NAME,
  STORAGE_SYSTEM_EXTERNAL_VIEW_NAME,
  CEPH_EXTERNAL_CLUSTER_VIEW_NAME,
} from '../../../constants';
import { ACMMulticlusterViewModel } from '../../../models';
import { ACMManagedClusterViewKind } from '../../../types';
import { isMinimumSupportedODFVersion } from '../../../utils/disaster-recovery';
import {
  ManagedClusterView,
  Cluster,
  DRPolicyAction,
  DRPolicyActionType,
} from './reducer';
import './create-dr-policy.scss';

export const getAcmClusterObj = (clusterName: string) => ({
  subscription: {
    apiVersion: getAPIVersionForModel(ACMMulticlusterViewModel),
    kind: ACMMulticlusterViewModel.kind,
    metadata: {
      name: ODF_OPERATOR_SUBSCRIPTION_VIEW_NAME,
      namespace: clusterName,
      labels: {
        [CREATE_BY_LABEL]: MCO_PLUGIN_NAME,
      },
    },
    spec: {
      scope: {
        name: ODF_OPERATOR_SUBSCRIPTION_NAME,
        apiGroup: SubscriptionModel.apiGroup,
        kind: SubscriptionModel.kind,
        version: SubscriptionModel.apiVersion,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
    },
  },
  storageSystem: {
    apiVersion: getAPIVersionForModel(ACMMulticlusterViewModel),
    kind: ACMMulticlusterViewModel.kind,
    metadata: {
      name: STORAGE_SYSTEM_INTERNAL_VIEW_NAME,
      namespace: clusterName,
      labels: {
        [CREATE_BY_LABEL]: MCO_PLUGIN_NAME,
      },
    },
    spec: {
      scope: {
        name: STORAGE_SYSTEM_INTERNAL_NAME,
        resource: ODFStorageSystem.kind,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
    },
  },
  cephCluster: {
    apiVersion: getAPIVersionForModel(ACMMulticlusterViewModel),
    kind: ACMMulticlusterViewModel.kind,
    metadata: {
      name: CEPH_INTERNAL_CLUSTER_VIEW_NAME,
      namespace: clusterName,
      labels: {
        [CREATE_BY_LABEL]: MCO_PLUGIN_NAME,
      },
    },
    spec: {
      scope: {
        name: CEPH_INTERNAL_CLUSTER_NAME,
        resource: CephClusterModel.kind,
        namespace: CEPH_STORAGE_NAMESPACE,
      },
    },
  },
});

const deleteResource = (resource: ACMManagedClusterViewKind, promises: Promise<K8sResourceKind>[]) => {
    promises.push(
        k8sDelete({
            resource,
            model: ACMMulticlusterViewModel,
            json: null,
            requestInit: null,
            cluster: HUB_CLUSTER_NAME,
        })
    );
};

export const deleteManagedClusterView = (
  clusterName: string,
  dispatch: React.Dispatch<DRPolicyAction>
) => {
 const promises: Promise<K8sResourceKind>[] = [];
    deleteResource(getAcmClusterObj(clusterName).subscription, promises);
    
    const resourceSS: ACMManagedClusterViewKind =
      getAcmClusterObj(clusterName).storageSystem;
    deleteResource(resourceSS, promises);
    resourceSS.metadata.name = STORAGE_SYSTEM_EXTERNAL_VIEW_NAME;
    deleteResource(resourceSS, promises);

    const resourceCeph: ACMManagedClusterViewKind =
      getAcmClusterObj(clusterName).cephCluster;
    deleteResource(resourceCeph, promises);
    resourceCeph.metadata.name = CEPH_EXTERNAL_CLUSTER_VIEW_NAME;
    deleteResource(resourceCeph, promises);

  Promise.all(promises)
    .then(() => {
        dispatch({
            type: DRPolicyActionType.SET_ERROR_MESSAGE,
            payload: ''
        });
    })
    .catch((error) => {
        if(!error?.message.includes("not found")) {
            dispatch({
                type: DRPolicyActionType.SET_ERROR_MESSAGE,
                payload: error?.message
            })
        }
    });
};

export const createManagedClusterView = (
  clusterName: string,
  managedClusterView: ManagedClusterView,
  dispatch: React.Dispatch<DRPolicyAction>
) => {
  const promises: Promise<K8sResourceKind>[] = [];
  if (!managedClusterView?.subscriptionViewLoaded) {
    const payload: ACMManagedClusterViewKind =
      getAcmClusterObj(clusterName).subscription;
    promises.push(k8sCreate({ model: ACMMulticlusterViewModel, data: payload }));
  }

  if (!managedClusterView?.storageSystemViewLoaded) {
    // Internal StorageSystem
    const payload: ACMManagedClusterViewKind =
      getAcmClusterObj(clusterName).storageSystem;
    promises.push(k8sCreate({ model: ACMMulticlusterViewModel, data: payload }));
    // External StorageSystem
    payload.metadata.name = STORAGE_SYSTEM_EXTERNAL_VIEW_NAME;
    promises.push(k8sCreate({ model: ACMMulticlusterViewModel, data: payload }));
  }

  if (!managedClusterView?.cephClusterLoaded) {
    // Internal CephCluster
    const payload: ACMManagedClusterViewKind =
      getAcmClusterObj(clusterName).cephCluster;
    promises.push(k8sCreate({ model: ACMMulticlusterViewModel, data: payload }));
    // External CephCluster
    payload.metadata.name = CEPH_EXTERNAL_CLUSTER_VIEW_NAME;
    promises.push(k8sCreate({ model: ACMMulticlusterViewModel, data: payload }));
  }
  Promise.all(promises)
    .then(() => {
        dispatch({
            type: DRPolicyActionType.SET_ERROR_MESSAGE,
            payload: ''
        });
    })
    .catch((error) => {
        if(!error?.message.includes("already exists")) {
            dispatch({
                type: DRPolicyActionType.SET_ERROR_MESSAGE,
                payload: error?.message
            })
        }
    }).finally(() => {
        setTimeout(deleteManagedClusterView, 20000, clusterName, dispatch);
    });
};

type SelectedClusterProps = {
  id: number;
  cluster: Cluster;
  managedClusterView: ManagedClusterView;
  dispatch: React.Dispatch<DRPolicyAction>;
};

export const SelectedCluster: React.FC<SelectedClusterProps> = ({
  id,
  cluster,
  managedClusterView,
  dispatch,
}) => {
  const { name, region, storageSystemName } = cluster;

  React.useEffect(() => {
    if (
      managedClusterView?.subscriptionViewLoaded &&
      managedClusterView?.storageSystemViewLoaded &&
      managedClusterView?.cephClusterLoaded
    ) {
      const storageSystem = managedClusterView?.storageSystem;
      const cephCluster = managedClusterView?.cephCluster;
      const odfVersion =
        managedClusterView?.subscription?.status?.currentCSV.split(
          'odf-operator.v'
        )[1] || '';
      const selectedClusters = {
        name,
        region,
        cephFSID: cephCluster?.status?.ceph?.fsid ?? '',
        storageSystemName: storageSystem?.metadata?.name ?? '',
        cephClusterName: storageSystem?.spec?.name ?? '',
        odfVersion: odfVersion,
        isValidODFVersion: isMinimumSupportedODFVersion(odfVersion),
        storageSystemLoaded: true,
        cephClusterLoaded: true,
        subscriptionLoaded: true,
      };
      dispatch({
        type: DRPolicyActionType.UPDATE_SELECTED_CLUSTERS,
        payload: selectedClusters,
      });
    }
  }, [name, region, storageSystemName, managedClusterView, dispatch]);

  return (
    <Flex
      display={{ default: 'inlineFlex' }}
      className="mco-create-data-policy__flex"
    >
      <FlexItem>
        <Badge key={id} isRead>
          {id}
        </Badge>
      </FlexItem>
      <FlexItem>
        <TextContent>
          <Text component={TextVariants.p}>{name}</Text>
          <Text component={TextVariants.small}>{region}</Text>
          <Text component={TextVariants.small}>{storageSystemName}</Text>
        </TextContent>
      </FlexItem>
    </Flex>
  );
};
