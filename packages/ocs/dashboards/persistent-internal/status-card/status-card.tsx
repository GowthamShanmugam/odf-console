import * as React from 'react';
import { useODFSystemFlagsSelector } from '@odf/core/redux';
import { getResourceInNs as getCephClusterInNs } from '@odf/core/utils';
import { getCephHealthState } from '@odf/ocs/utils';
import { healthStateMapping } from '@odf/shared/dashboards/status-card/states';
import {
  useCustomPrometheusPoll,
  usePrometheusBasePath,
} from '@odf/shared/hooks/custom-prometheus-poll';
import useAlerts from '@odf/shared/monitoring/useAlert';
import { alertURL } from '@odf/shared/monitoring/utils';
import { K8sResourceKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { filterCephAlerts, referenceForModel } from '@odf/shared/utils';
import {
  Alert,
  HealthState,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  AlertItem,
  AlertsBody,
  HealthBody,
  HealthItem,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { SubsystemHealth } from '@openshift-console/dynamic-plugin-sdk/lib/extensions/dashboard-types';
import * as _ from 'lodash-es';
import { useParams } from 'react-router-dom-v5-compat';
import {
  Gallery,
  GalleryItem,
  Flex,
  FlexItem,
  Card,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';
import { CephClusterModel } from '../../../models';
import { DATA_RESILIENCY_QUERY, StorageDashboardQuery } from '../../../queries';
import { ODFSystemParams } from '../../../types';
import { OSDMigrationProgress } from './osd-migration/osd-migration-progress';
import { getDataResiliencyState } from './utils';
import { whitelistedHealthChecksRef } from './whitelisted-health-checks';
import './healthchecks.scss';

const resiliencyProgressQuery = (managedByOCS: string) =>
  DATA_RESILIENCY_QUERY(managedByOCS)[
    StorageDashboardQuery.RESILIENCY_PROGRESS
  ];

const generateDocumentationLink = (alert: Alert): string => {
  return `https://access.redhat.com/documentation/en-us/red_hat_openshift_data_foundation/4.12/html-single/troubleshooting_openshift_data_foundation/index#${_.toLower(
    alert?.labels?.alertname
  )}_rhodf`;
};

const isCephBasedAlert = (alert: Alert): boolean => {
  return alert?.annotations?.storage_type === 'ceph';
};

const getDocumentationLink = (alert: Alert): string => {
  if (isCephBasedAlert(alert)) {
    return generateDocumentationLink(alert);
  }
  return null;
};

export const CephAlerts: React.FC = () => {
  const [alerts, loaded, error] = useAlerts();
  // ToDo (epic 4422): Get StorageCluster name and namespace from the Alert object
  // and filter Alerts based on that for a particular cluster.
  const filteredAlerts =
    loaded && !error && !_.isEmpty(alerts) ? filterCephAlerts(alerts) : [];

  return (
    <AlertsBody error={!_.isEmpty(error)}>
      {loaded &&
        filteredAlerts.length > 0 &&
        filteredAlerts?.map((alert) => (
          <AlertItem
            key={alertURL(alert, alert?.rule?.id)}
            alert={alert as any}
            documentationLink={getDocumentationLink(alert)}
          />
        ))}
    </AlertsBody>
  );
};

const CephHealthCheck: React.FC<CephHealthCheckProps> = ({
  cephHealthState,
  healthCheck,
}) => {
  const { t } = useCustomTranslation();
  return (
    <Flex flexWrap={{ default: 'nowrap' }} direction={{ default: 'row' }}>
      <FlexItem>
        {
          (
            healthStateMapping[cephHealthState.state] ||
            healthStateMapping[HealthState.UNKNOWN]
          ).icon
        }
      </FlexItem>
      <FlexItem>
        <div data-test="healthcheck-message">{healthCheck?.details}</div>
      </FlexItem>
      <FlexItem>
        {!!healthCheck.troubleshootLink && (
          <a
            className="ceph-health-check-card__link"
            href={healthCheck.troubleshootLink}
          >
            {t('Troubleshoot')}
          </a>
        )}
      </FlexItem>
    </Flex>
  );
};

const cephClusterResource = {
  kind: referenceForModel(CephClusterModel),
  isList: true,
};

export const StatusCard: React.FC = () => {
  const { t } = useCustomTranslation();
  const [data, loaded, loadError] =
    useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);

  const { namespace: clusterNs } = useParams<ODFSystemParams>();
  const { systemFlags } = useODFSystemFlagsSelector();
  const managedByOCS = systemFlags[clusterNs]?.ocsClusterName;

  const [resiliencyProgress, resiliencyProgressError] = useCustomPrometheusPoll(
    {
      query: resiliencyProgressQuery(managedByOCS),
      endpoint: 'api/v1/query' as any,
      basePath: usePrometheusBasePath(),
    }
  );

  const cephCluster = getCephClusterInNs(data, clusterNs);

  const cephHealthState = getCephHealthState(
    { ceph: { data: cephCluster, loaded, loadError } },
    t
  );
  const dataResiliencyState = getDataResiliencyState(
    [{ response: resiliencyProgress, error: resiliencyProgressError }],
    t
  );

  const pattern = /[A-Z]+_*|error/g;
  const healthChecks: CephHealthCheckType[] = [];
  const cephDetails = cephCluster?.status?.ceph?.details;
  for (const key in cephDetails) {
    if (pattern.test(key)) {
      const healthCheckObject: CephHealthCheckType = {
        id: key,
        details: cephDetails[key].message,
        troubleshootLink: whitelistedHealthChecksRef[key] ?? null,
      };
      healthChecks.push(healthCheckObject);
    }
  }

  return (
    <Card className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('Status')}</CardTitle>
      </CardHeader>
      <HealthBody>
        <Gallery className="co-overview-status__health" hasGutter>
          <GalleryItem>
            <HealthItem
              title={t('Storage Cluster')}
              state={cephHealthState.state}
              details={cephHealthState.message}
              popupTitle={healthChecks ? t('Active health checks') : null}
            >
              {healthChecks?.map((healthCheck: CephHealthCheckType, i) => (
                <CephHealthCheck
                  key={`${i}`}
                  cephHealthState={cephHealthState}
                  healthCheck={healthCheck}
                />
              ))}
            </HealthItem>
          </GalleryItem>
          <GalleryItem>
            <HealthItem
              title={t('Data Resiliency')}
              state={dataResiliencyState.state}
              details={dataResiliencyState.message}
            />
          </GalleryItem>
        </Gallery>
      </HealthBody>
      <OSDMigrationProgress
        cephData={cephCluster}
        dataLoaded={loaded}
        dataLoadError={loadError}
      />
      <CephAlerts />
    </Card>
  );
};

export default StatusCard;

type CephHealthCheckType = {
  id: string;
  details: string;
  troubleshootLink?: string;
};

type CephHealthCheckProps = {
  cephHealthState: SubsystemHealth;
  healthCheck: CephHealthCheckType;
};
