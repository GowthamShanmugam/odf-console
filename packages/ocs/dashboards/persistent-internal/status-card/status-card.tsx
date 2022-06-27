import * as React from 'react';
import { healthStateMapping } from '@odf/shared/dashboards/status-card/states';
import {
  useCustomPrometheusPoll,
  usePrometheusBasePath,
} from '@odf/shared/hooks/custom-prometheus-poll';
import useAlerts from '@odf/shared/monitoring/useAlert';
import { alertURL } from '@odf/shared/monitoring/utils';
import { K8sResourceKind } from '@odf/shared/types';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { referenceForModel } from '@odf/shared/utils';
import {
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
import * as _ from 'lodash';
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
import { getAlertsFromRules } from '../../../utils';
import { filterCephAlerts } from '../../../utils/metrics';
import { getCephHealthState, getDataResiliencyState } from './utils';
import { whitelistedHealthChecksRef } from './whitelisted-health-checks';
import './healthchecks.scss';

const resiliencyProgressQuery =
  DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS];

export const CephAlerts: React.FC = () => {
  const [data, loaded, error] = useAlerts();
  const alerts = data
    ? filterCephAlerts(getAlertsFromRules(data?.data?.groups))
    : [];

  return (
    <AlertsBody error={!_.isEmpty(error)}>
      {loaded &&
        alerts.length > 0 &&
        alerts.map((alert) => (
          <AlertItem
            key={alertURL(alert, alert?.rule?.id)}
            alert={alert as any}
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

export const cephClusterResource = {
  kind: referenceForModel(CephClusterModel),
  namespaced: false,
  isList: true,
};

export const StatusCard: React.FC = () => {
  const { t } = useCustomTranslation();
  const [data, loaded, loadError] =
    useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);

  const [resiliencyProgress, resiliencyProgressError] = useCustomPrometheusPoll(
    {
      query: resiliencyProgressQuery,
      endpoint: 'api/v1/query' as any,
      basePath: usePrometheusBasePath(),
    }
  );

  const cephHealthState = getCephHealthState(
    { ceph: { data, loaded, loadError } },
    t
  );
  const dataResiliencyState = getDataResiliencyState(
    [{ response: resiliencyProgress, error: resiliencyProgressError }],
    t
  );

  const pattern = /[A-Z]+_*|error/g;
  const healthChecks: CephHealthCheckType[] = [];
  const cephDetails = data?.[0]?.status?.ceph?.details;
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
