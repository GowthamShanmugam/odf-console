/**
 * Add components specific to appicaltion-wise card here
 */

import * as React from 'react';
import {
  SLA_STATUS,
  DRPC_STATUS,
  ACM_ENDPOINT,
  HUB_CLUSTER_NAME,
  TIME_UNITS,
} from '@odf/mco/constants';
import {
  PlacementInfo,
  ProtectedAppSetsMap,
  ProtectedPVCData,
} from '@odf/mco/types';
import {
  getSLAStatus,
  getDRStatus,
  convertSyncIntervalToSeconds,
} from '@odf/mco/utils';
import { defaultYMutator } from '@odf/shared/charts';
import { AreaChart } from '@odf/shared/dashboards/utilization-card/area-chart';
import { trimSecondsXMutator } from '@odf/shared/dashboards/utilization-card/utilization-item';
import { dateToSeconds } from '@odf/shared/details-page/datetime';
import { useCustomPrometheusPoll } from '@odf/shared/hooks/custom-prometheus-poll';
import { URL_POLL_DEFAULT_DELAY } from '@odf/shared/hooks/custom-prometheus-poll/use-url-poll';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import { humanizeTime, humanizeDay, DataPoint } from '@odf/shared/utils';
import {
  PrometheusResponse,
  PrometheusResult,
} from '@openshift-console/dynamic-plugin-sdk';
import { UtilizationDurationDropdown } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useUtilizationDuration } from '@openshift-console/dynamic-plugin-sdk-internal';
import { chart_color_orange_300 as thresholdColor } from '@patternfly/react-tokens/dist/js/chart_color_orange_300';
import { TFunction } from 'i18next';
import { getLastSyncTimeDRPCQuery } from '../../queries';

const humanizeMinutesSLA = (value) => {
  const val = Number(value);
  return humanizeTime(val, 's', 'm');
};

const humanizeHourSLA = (value) => {
  const val = Number(value);
  return humanizeTime(val, 's', 'h');
};

const humanizeDaysSLA = (value) => {
  return humanizeDay(humanizeHourSLA(value).value, null, 'd');
};

export const getRangeVectorStats: CustomGetRangeStats = (
  response,
  description,
  symbol,
  threshold
) => {
  return (
    response?.data?.result?.map((r) => {
      return r?.values?.map(([x, y]) => {
        return {
          x: trimSecondsXMutator(x),
          y: threshold ? threshold : defaultYMutator(y),
          description,
          symbol,
        } as DataPoint<Date>;
      });
    }) || []
  );
};

export const mapLimitsRequests = (
  utilization: PrometheusResponse,
  threshold: number,
  t?: any
): { data: DataPoint[][]; chartStyle: object[] } => {
  const utilizationData = getRangeVectorStats(utilization, 'actual SLA', null);
  const data = utilizationData ? [...utilizationData] : [];
  const chartStyle = [null];
  if (threshold) {
    const reqData = getRangeVectorStats(
      utilization,
      t('scheduled SLA'),
      {
        type: 'dash',
        fill: thresholdColor.value,
      },
      threshold
    );
    data.push(...reqData);
    if (reqData.length) {
      chartStyle.push({
        data: {
          stroke: thresholdColor.value,
          strokeDasharray: '3,3',
          fillOpacity: 0,
        },
      });
    }
  }

  return { data, chartStyle };
};

const getCurrentActivity = (
  currentStatus: string,
  failoverCluster: string,
  preferredCluster: string,
  t: TFunction
) => {
  if (
    [DRPC_STATUS.Relocating, DRPC_STATUS.Relocated].includes(
      currentStatus as DRPC_STATUS
    )
  ) {
    return t('{{ currentStatus }} to {{ preferredCluster }}', {
      currentStatus,
      preferredCluster,
    });
  } else if (
    [DRPC_STATUS.FailingOver, DRPC_STATUS.FailedOver].includes(
      currentStatus as DRPC_STATUS
    )
  ) {
    return t('{{ currentStatus }} to {{ failoverCluster }}', {
      currentStatus,
      failoverCluster,
    });
  } else {
    return t('Unknown');
  }
};

export const ProtectedPVCsSection: React.FC<ProtectedPVCsSectionProps> = ({
  protectedPVCData,
  selectedAppSet,
}) => {
  const { t } = useCustomTranslation();
  const clearSetIntervalId = React.useRef<NodeJS.Timeout>();
  const [ProtectedPVC, setProtectedPVC] = React.useState([0, 0]);
  const [protectedPVCsCount, pvcsWithIssueCount] = ProtectedPVC;

  const updateProtectedPVC = () => {
    const placementInfo = selectedAppSet?.placementInfo?.[0];
    const issueCount =
      protectedPVCData?.reduce((acc, protectedPVC) => {
        if (
          protectedPVC?.drpcName === placementInfo?.drpcName &&
          protectedPVC?.drpcNamespace === placementInfo?.drpcNamespace &&
          getSLAStatus(
            dateToSeconds(protectedPVC?.lastSyncTime),
            protectedPVC?.schedulingInterval
          )[0] !== SLA_STATUS.HEALTHY
        )
          return acc + 1;
        else return acc;
      }, 0) || 0;

    setProtectedPVC([protectedPVCData?.length || 0, issueCount]);
  };

  React.useEffect(() => {
    updateProtectedPVC();
    clearSetIntervalId.current = setInterval(
      updateProtectedPVC,
      URL_POLL_DEFAULT_DELAY
    );
    return () => clearInterval(clearSetIntervalId.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppSet, protectedPVCData]);

  return (
    <div className="mco-dashboard__contentColumn">
      <div className="mco-dashboard__title mco-dashboard__subtitle--size">
        {protectedPVCsCount}
      </div>
      <div className="mco-dashboard__title">{t('Protected PVCs')}</div>
      <div className="text-muted">
        {t('{{ pvcsWithIssueCount }} with issues', { pvcsWithIssueCount })}
      </div>
    </div>
  );
};

export const RPOSection: React.FC<CommonProps> = ({
  selectedAppSet,
  lastSyncTimeData,
}) => {
  const { t } = useCustomTranslation();

  const rpo = React.useMemo(() => {
    const currentTime = new Date().getTime();
    const placementInfo = selectedAppSet?.placementInfo?.[0];
    const item = lastSyncTimeData?.data?.result?.find(
      (item: PrometheusResult) =>
        item?.metric?.namespace === placementInfo?.drpcNamespace &&
        item?.metric?.name === placementInfo?.drpcName
    );
    const lastSyncTime = new Date(item?.value[1]).getTime();
    const rpo = ((lastSyncTime - currentTime) / 1000).toString();
    return !!rpo ? rpo : 'N/A';
  }, [selectedAppSet, lastSyncTimeData]);

  return (
    <div className="mco-dashboard__contentColumn">
      <div className="mco-dashboard__title">{t('{{ rpo }} sec', { rpo })}</div>
      <div className="mco-dashboard__title">{t('RPO')}</div>
    </div>
  );
};

export const ActivitySection: React.FC<CommonProps> = ({ selectedAppSet }) => {
  const { t } = useCustomTranslation();

  const placementInfo: PlacementInfo = selectedAppSet?.placementInfo?.[0];
  const currentStatus = placementInfo?.status;
  const failoverCluster = placementInfo?.failoverCluster;
  const preferredCluster = placementInfo?.preferredCluster;
  return (
    <div className="mco-dashboard__contentColumn">
      <div className="mco-dashboard__title">{t('Activity')}</div>
      <div className="mco-dashboard__contentRow">
        {getDRStatus({ currentStatus, t }).icon}
        <div className="text-muted mco-cluster-app__text--padding-left">
          {getCurrentActivity(
            currentStatus,
            failoverCluster,
            preferredCluster,
            t
          )}
        </div>
      </div>
    </div>
  );
};

export const SnapshotSection: React.FC<CommonProps> = ({ selectedAppSet }) => {
  const { t } = useCustomTranslation();

  const lastSyncTime =
    selectedAppSet?.placementInfo?.[0]?.lastGroupSyncTime || 'N/A';
  return (
    <div className="mco-dashboard__contentColumn">
      <div className="mco-dashboard__title">{t('Snapshot')}</div>
      <div className="text-muted">
        {t('Last on: {{ lastSyncTime }}', { lastSyncTime })}
      </div>
    </div>
  );
};

export const ReplicationHistorySection: React.FC<ReplicationHistorySectionProps> =
  ({ selectedAppSet }) => {
    const { t } = useCustomTranslation();
    const { duration } = useUtilizationDuration();
    const placementInfo = selectedAppSet?.placementInfo?.[0];
    const [thresholdInSeconds, unit] = convertSyncIntervalToSeconds(
      placementInfo?.syncInterval
    );

    const [pvcsSLARangeData, pvcsSLARangeError, pvcsSLARangeLoading] =
      useCustomPrometheusPoll({
        endpoint: 'api/v1/query_range' as any,
        query: getLastSyncTimeDRPCQuery(
          placementInfo?.drpcNamespace,
          placementInfo?.drpcName
        ),
        delay: duration,
        basePath: ACM_ENDPOINT,
        cluster: HUB_CLUSTER_NAME,
      });

    const { data, chartStyle } = mapLimitsRequests(
      pvcsSLARangeData,
      thresholdInSeconds,
      t
    );

    return (
      <div className="mco-dashboard__contentColumn">
        <div className="mco-dashboard__contentRow mco-cluster-app__contentRow--spaceBetween">
          <div className="mco-dashboard__title mco-cluster-app__contentRow--flexStart">
            {t('Replication history')}
          </div>
          <div className="mco-dashboard__contentRow mco-cluster-app__contentRow--flexEnd">
            <UtilizationDurationDropdown />
          </div>
        </div>
        <AreaChart
          data={data}
          loading={!pvcsSLARangeError && pvcsSLARangeLoading}
          chartStyle={chartStyle}
          mainDataName="SLA"
          humanize={
            (unit === TIME_UNITS.Days && humanizeDaysSLA) ||
            (unit === TIME_UNITS.Hours && humanizeHourSLA) ||
            (unit === TIME_UNITS.Minutes && humanizeMinutesSLA)
          }
        />
      </div>
    );
  };

type ProtectedPVCsSectionProps = {
  protectedPVCData: ProtectedPVCData[];
  selectedAppSet: ProtectedAppSetsMap;
};

type CommonProps = {
  selectedAppSet: ProtectedAppSetsMap;
  lastSyncTimeData?: PrometheusResponse;
};

type ReplicationHistorySectionProps = {
  selectedAppSet: ProtectedAppSetsMap;
};

type CustomGetRangeStats = (
  response: PrometheusResponse,
  description?: string,
  symbol?: { fill?: string; type?: string },
  threshold?: Number
) => DataPoint<Date>[][];
