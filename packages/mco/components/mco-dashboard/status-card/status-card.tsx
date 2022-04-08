import * as React from 'react';
import HealthItem from '@odf/shared/dashboards/status-card/HealthItem';
import { healthStateMap, csvStatusMap } from '@odf/shared/dashboards/status-card/states';
import { useURLPoll } from '@odf/shared/hooks/use-url-poll/use-url-poll';
import { getGVK } from '@odf/shared/utils';
import { PrometheusResponse } from '@openshift-console/dynamic-plugin-sdk';
import { HealthBody } from '@openshift-console/dynamic-plugin-sdk-internal';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  Flex,
  FlexItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';
import { ODF_OPERATOR } from '../../../constants/dr-policy';
import { OCSStorageClusterModel } from '../../../models/models';
import { STATUS_QUERIES, StorageDashboard } from '../queries';
import { StorageSystemPopup, ODFOperatorPopup,SystemHealthMap, CSVStatusMap } from './storage-system-popup';
import './status-card.scss';

const ACM_ENDPOINT = '/acm-thanos-querier/api/v1/query?query';

type SubSystemMap = {
  [key: string]: string
}

const getWorstHealth = (healthData: SystemHealthMap[]) =>
  healthData.reduce((acc, item) => acc < item?.rawHealthData ? item?.rawHealthData : acc, '0');

const getUnifiedHealthValue = (sysHealthVal: string, subSysHealthVal: string) =>
  !!subSysHealthVal ? (sysHealthVal < subSysHealthVal ? subSysHealthVal: sysHealthVal) : sysHealthVal;

const setSubSystemMap = (subSysHealthData: PrometheusResponse, subSystemMap: SubSystemMap) =>
  subSysHealthData?.data?.result?.forEach((item) =>
    !item?.metric.managedBy && (item?.metric.system_type === 'OCS') && (subSystemMap[item?.metric.cluster] = item?.value[1]));

const setHealthData = (sysHealthData: PrometheusResponse, healthData: SystemHealthMap[], subSystemMap: SubSystemMap) =>
  sysHealthData?.data?.result?.forEach((item) => {
    const { apiGroup } = getGVK(item?.metric.target_kind);
    const healthVal = item?.value[1];
    const unifiedHealthVal = getUnifiedHealthValue(healthVal, subSystemMap[item?.metric.cluster]);
    healthData.push({
      systemName: item?.metric?.storage_system,
      rawHealthData: apiGroup === OCSStorageClusterModel.apiGroup ? unifiedHealthVal : healthVal,
    });
  });

const StorageSystemHealthItem: React.FC = () => {
  const { t } = useTranslation('plugin__odf-console');

  const [worstHealth, setWorstHealth] = React.useState<string>('');
  const [sysHealthData, sysHealthError, sysHealthLoading] =
    useURLPoll<PrometheusResponse>(`${ACM_ENDPOINT}=${STATUS_QUERIES[StorageDashboard.SYSTEM_HEALTH]}`);
  const [subSysHealthData, subSysHealthError, subSysHealthLoading] =
    useURLPoll<PrometheusResponse>(`${ACM_ENDPOINT}=${STATUS_QUERIES[StorageDashboard.HEALTH]}`);

  const parsedHealthData = React.useMemo(() => {
    const healthData = [];
    const subSystemMap = {};
    !subSysHealthError && !subSysHealthLoading && setSubSystemMap(subSysHealthData, subSystemMap);
    !sysHealthError && !sysHealthLoading && setHealthData(sysHealthData, healthData, subSystemMap);
    setWorstHealth(getWorstHealth(healthData));
    return healthData;
  },
  [sysHealthData,
  subSysHealthData,
  sysHealthError,
  subSysHealthError,
  sysHealthLoading,
  subSysHealthLoading]);

  return parsedHealthData.length > 0 ? (
    <HealthItem
    title={t('Systems')}
    state={healthStateMap(worstHealth)}
    maxWidth='25rem'
    >
      <StorageSystemPopup systemHealthMap={parsedHealthData} />
    </HealthItem>
  ) : <></>;
};

/**
 * For system health metrics, '0' means healthy.
 * For csv status metrics, '0' means unhealthy.
 */
const getWorstStatus  = (csvStatusData: CSVStatusMap[]) =>
  csvStatusData.some((item) => item?.rawCSVData !== '1') ? '0' : '1';

const setCSVStatusData = (csvData: PrometheusResponse, csvStatusData: CSVStatusMap[]) =>
  csvData?.data?.result?.forEach((item) =>
    item?.metric.name.startsWith(ODF_OPERATOR) && csvStatusData.push({
      rawCSVData: item?.value[1],
    }));

const CSVStatusHealthItem: React.FC = () => {
  const { t } = useTranslation('plugin__odf-console');

  const [worstStatus, setWorstStatus] = React.useState<string>('');
  const [csvData, csvError, csvLoading] =
    useURLPoll<PrometheusResponse>(`${ACM_ENDPOINT}=${STATUS_QUERIES[StorageDashboard.CSV_STATUS]}`);

  const parsedCSVData = React.useMemo(() => {
    let csvStatusData = [];
    !csvError && !csvLoading && setCSVStatusData(csvData, csvStatusData);
    setWorstStatus(getWorstStatus(csvStatusData));
    return csvStatusData;
  }, [csvData, csvError, csvLoading]);

  return parsedCSVData.length > 0 ? (
    <HealthItem
    title={t('Openshift Data Foundation')}
    state={csvStatusMap(worstStatus)}
    >
      <ODFOperatorPopup csvStatusMap={parsedCSVData} />
     </HealthItem>
  ) : <></>;
};

export const StatusCard: React.FC = () => {
  const { t } = useTranslation('plugin__odf-console');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Status')}</CardTitle>
      </CardHeader>
      <CardBody>
        <HealthBody>
          <Flex
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            className="odf-StatusCard__items--width"
          >
            <FlexItem>
              <CSVStatusHealthItem />
            </FlexItem>
            <FlexItem>
              <StorageSystemHealthItem />
            </FlexItem>
          </Flex>
        </HealthBody>
      </CardBody>
    </Card>
  );
};
