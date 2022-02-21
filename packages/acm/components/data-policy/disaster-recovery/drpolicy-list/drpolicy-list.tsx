import * as React from 'react';
import { ClusterServiceVersionModel } from '@odf/shared/models';
import { RowFunctionArgs } from '@odf/shared/types';

import {
  referenceForModel,
} from '@odf/shared/utils';
import {
  Table,
  TableData,
  ListPage,
  Kebab,
  ResourceKebab
} from '@openshift-console/dynamic-plugin-sdk-internal-kubevirt';

import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { sortable, wrappable } from '@patternfly/react-table';
import { DRPolicyModel } from '../../../models';

import { DRPolicyKind } from '../../../types';
import { getActions } from './actions';

const DRPolicyTableRow: React.FC<RowFunctionArgs<DRPolicyKind>> = ({obj}) => {
  const { t } = useTranslation('plugin__odf-console');
    return (
      <>
        <TableData className={tableColumnClasses[0]}>
          {obj?.metadata?.name}
        </TableData>
        <TableData className={tableColumnClasses[1]}>
          {obj?.status?.phase}
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          {obj.spec.drClusterSet.map(function(dataSet){
             return dataSet.name;
          }).join(" ")}
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          {"Asynchronus"}
        </TableData>
        <TableData className={tableColumnClasses[4]}>
          {"App1 App2"}
        </TableData>
        <TableData className={tableColumnClasses[5]}>
          <ResourceKebab
            actions={getActions(DRPolicyModel.kind)}
            resource={obj}
            kind={referenceForModel(DRPolicyModel)}
            customData={{ tFunction: t }}
          />
        </TableData>
      </>
    );
  };

  const tableColumnClasses = [
    'pf-u-w-15-on-xl',
    'pf-m-hidden pf-m-visible-on-md pf-u-w-12-on-xl',
    'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
    'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
    'pf-m-hidden pf-m-visible-on-lg pf-u-w-12-on-xl',
    Kebab.columnClass,
  ];

const DRPolicyList: React.FC<DRPolicyListProps> = (props) => {
  const { t } = useTranslation('plugin__odf-console');
  const Header = () => {
    return [
      {
        title: t('Name'),
        sortField: 'metadata.name',
        transforms: [sortable, wrappable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('Status'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: t('Clusters'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('Replication Policy'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('Applications'),
        transforms: [wrappable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[5] },
      },
    ];
  };
  Header.displayName = 'SSHeader';


  return (
    <Table
      {...props}
      aria-label={t('Storage Systems')}
      Header={Header}
      Row={DRPolicyTableRow}
      virtualize
    />
  );
};

export const DRPolicyListPage: React.FC<RouteComponentProps> = (props) => {
  const createProps = {
    to: `/multicloud/dataservices/datapolicy/dr/${referenceForModel(
      ClusterServiceVersionModel
    )}/${referenceForModel(DRPolicyModel)}/~new`,
  };
  return (
    <ListPage
      {...props}
      showTitle={false}
      ListComponent={DRPolicyList}
      kind={referenceForModel(DRPolicyModel)}
      canCreate
      createProps={createProps}
      createButtonText = "Create DR Policy"
      limit = {100}
    />
  );
};

type DRPolicyListProps = {
  ListComponent: React.ComponentType;
  kinds: string[];
};

