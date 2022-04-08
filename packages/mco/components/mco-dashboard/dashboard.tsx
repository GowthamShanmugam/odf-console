import * as React from 'react';
import PageHeading from '@odf/shared/heading/page-heading';
import { HorizontalNav } from '@openshift-console/dynamic-plugin-sdk';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import { Grid, GridItem } from '@patternfly/react-core';
import { StatusCard } from './status-card/status-card';
import SystemCapacityCard from './system-capacity-card/capacity-card';

type MCODashboardPageProps = {
  history: RouteComponentProps['history'];
};

const UpperSection: React.FC = () => (
  <Grid hasGutter>
    <GridItem md={12} sm={12}>
      <StatusCard />
    </GridItem>
    <GridItem md={12} sm={12}>
      <SystemCapacityCard />
    </GridItem>
  </Grid>
);

export const MCODashboard: React.FC = () => {
  return (
    <>
      <div className="co-dashboard-body">
        <UpperSection />
      </div>
    </>
  );
};

const MCODashboardPage: React.FC<MCODashboardPageProps> = (props) => {
  const { t } = useTranslation('plugin__odf-console');
  const title = t('Storage System');
  const pages = [
    {
      href: '',
      name: t('Overview'),
      component: MCODashboard,
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
      />
    </>
  );
};

export default MCODashboardPage;
