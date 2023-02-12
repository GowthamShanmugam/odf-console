/**
 * Add components specific to appicaltion-wise card here
 */

import * as React from 'react';
import {
  SLA_STATUS,
  DRPC_STATUS,
  ACM_ENDPOINT,
  HUB_CLUSTER_NAME,
} from '@odf/mco/constants';
import {
  PlacementInfo,
  ProtectedAppSetsMap,
  ProtectedPVCData,
} from '@odf/mco/types';
import { getSLAStatus, getDRStatus } from '@odf/mco/utils';
import { mapLimitsRequests } from '@odf/shared/charts';
import { AreaChart } from '@odf/shared/dashboards/utilization-card/area-chart';
import { trimSecondsXMutator } from '@odf/shared/dashboards/utilization-card/utilization-item';
import { useCustomPrometheusPoll } from '@odf/shared/hooks/custom-prometheus-poll';
import { URL_POLL_DEFAULT_DELAY } from '@odf/shared/hooks/custom-prometheus-poll/use-url-poll';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import {
  humanizeSeconds,
  secondsToNanoSeconds,
  DataPoint,
} from '@odf/shared/utils';
import {
  PrometheusResponse,
  PrometheusResult,
  Humanize,
} from '@openshift-console/dynamic-plugin-sdk';
import { useUtilizationDuration } from '@openshift-console/dynamic-plugin-sdk-internal';
import { chart_color_orange_300 as thresholdColor } from '@patternfly/react-tokens/dist/js/chart_color_orange_300';
import { TFunction } from 'i18next';
import { getLastSyncTimeDRPCQuery } from '../../queries';

const humanizeSLA: Humanize = (value) =>
  humanizeSeconds(secondsToNanoSeconds(value), null, 's');

const getThresholdData = (data: ChartData, syncInterval: string): ChartData => {
  if (!!data?.length) {
    return data?.map((r) => {
      return r?.map(
        (dataPoint) =>
          ({
            x: dataPoint.x,
            y: Number(syncInterval) || 0,
          } as DataPoint<string | number | Date>)
      );
    });
  }
  return [];
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
            protectedPVC?.lastSyncTime,
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

    /**
     * FIX THIS
     * ToDo(Sanjal): Find a way to add more info to tooltip of the chart
     * Also, update utils based upon unit of the data (sec, min etc)
     */
    const { data, chartStyle } = mapLimitsRequests(
      pvcsSLARangeData,
      null,
      null,
      trimSecondsXMutator,
      'SLA',
      t
    );
    const thresholdData: ChartData = getThresholdData(
      data,
      placementInfo?.syncInterval
    );
    data.push(...thresholdData);
    if (thresholdData.length) {
      chartStyle.push({
        data: {
          stroke: thresholdColor.value,
          strokeDasharray: '3,3',
          fillOpacity: 0,
        },
      });
    }

    return (
      <div className="mco-dashboard__contentColumn">
        <div className="mco-dashboard__contentRow mco-cluster-app__contentRow--spaceBetween">
          <div className="mco-dashboard__title mco-cluster-app__contentRow--flexStart">
            {t('Replication history')}
          </div>
        </div>
        <AreaChart
          data={data}
          loading={!pvcsSLARangeError && pvcsSLARangeLoading}
          /** FIX THIS
           * Assuming value from metric response is in sec
           */
          humanize={humanizeSLA}
          chartStyle={chartStyle}
          mainDataName="SLA"
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

type ChartData = DataPoint<string | number | Date>[][];
