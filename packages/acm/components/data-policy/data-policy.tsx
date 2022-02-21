import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { DRPolicyModel } from '../models/acm';

import PageHeading from '@odf/shared/heading/page-heading';

import { HorizontalNav } from '@openshift-console/dynamic-plugin-sdk';
import { DRPolicyListPage } from '@odf/acm/components/data-policy/disaster-recovery/drpolicy-list/drpolicy-list';


const DataPolicyPage: React.FC<any> = () => {
  const { t } = useTranslation('plugin__odf-console');
  const title = t('Data policies');
  const pages = [
    {
      href: '',
      name: t('Disaster recovery'),
      component: DRPolicyListPage,
    },
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
      </Helmet>
      <PageHeading title={title} />
      <HorizontalNav
        pages={pages}
        resource={{
            kind: DRPolicyModel.kind,
            apiVersion: `${DRPolicyModel.apiGroup}/${DRPolicyModel.apiVersion}`,
        }}
      />
    </>
  );
};

export default DataPolicyPage;
