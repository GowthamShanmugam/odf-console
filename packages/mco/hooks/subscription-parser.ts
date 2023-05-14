import * as React from 'react';
import { getName, getNamespace } from '@odf/shared/selectors';
import {
  ACMPlacementDecisionKind,
  ACMPlacementKind,
  ACMSubscriptionKind,
  ACMPlacementRuleKind,
} from '../types';
import {
  findDeploymentClusterNames,
  findPlacementDecisionUsingPlacement,
  getPlacementKind,
  matchApplicationToSubscription,
} from '../utils';
import { ApplicationKind } from '@odf/shared/types';
import {
  ACMPlacementModel,
  ACMPlacementRuleModel,
  ACMSubscriptionModel,
} from '../models';
import { DisasterRecoveryInfo } from './disaster-recovery-parser';

const subscriptionAppFilter = (application: ApplicationKind) =>
  application?.spec?.componentKinds?.some(
    (componentKind) =>
      componentKind?.group === ACMSubscriptionModel?.apiGroup &&
      componentKind?.kind === ACMSubscriptionModel?.kind
  );

const getClusterNamesFromPlsRule = (plsRule: ACMPlacementRuleKind) =>
  plsRule?.status?.decisions.map((decision) => decision?.clusterName);

const getClusterNamesFromPlacement = (
  placement: ACMPlacementKind,
  plsDecisions: ACMPlacementDecisionKind[]
): string[] => {
  const plsDecision = findPlacementDecisionUsingPlacement(
    placement,
    plsDecisions
  );
  return findDeploymentClusterNames(plsDecision);
};

const generateSubscriptionAppInfo = (
  application: ApplicationKind,
  subsToNamespaceMap: SubscriptionToNamespaceType,
  plsRuleToNamespaceMap: PlacementRuleToNamespaceType,
  plsToNamespaceMap: PlacementToNamespaceType,
  plDecisionToNamespaceMap: PlacementDecisionToNamespaceType
): SubscriptionAppInfo => {
  const appName = getName(application);
  const appNamespace = getNamespace(application);
  const subscriptions =
    Object.values(subsToNamespaceMap?.[appNamespace] ?? {}) || [];
  const subscriptionInfo: SubscriptionInfo[] = [];
  subscriptions.forEach((subscription) => {
    // applying subscription filter from application
    if (matchApplicationToSubscription(subscription, application)) {
      const placementRefKind =
        subscription?.spec?.placement?.placementRef?.kind;
      const placementRefName =
        subscription?.spec?.placement?.placementRef?.name;
      if (placementRefKind === ACMPlacementRuleModel.kind) {
        // fetch placement rule using subscription
        const plsRule =
          plsRuleToNamespaceMap?.[appNamespace]?.[placementRefName];
        !!plsRule &&
          subscriptionInfo.push({
            subscriptionName: getName(subscription),
            subscriptionNamespace: getNamespace(subscription),
            placementInfo: {
              placementName: getName(plsRule),
              placementKind: ACMPlacementRuleModel.kind,
              placementNamespace: getNamespace(plsRule),
              clusterNames: getClusterNamesFromPlsRule(plsRule),
            },
          });
      } else if (placementRefKind === ACMPlacementModel.kind) {
        // fetch placement using subscription
        const placement = plsToNamespaceMap?.[appNamespace]?.[placementRefName];
        const plsDecisions =
          Object.values(plDecisionToNamespaceMap?.[appNamespace] || {}) || [];
        !!placement &&
          subscriptionInfo.push({
            subscriptionName: getName(subscription),
            subscriptionNamespace: getNamespace(subscription),
            placementInfo: {
              placementName: getName(placement),
              placementKind: ACMPlacementModel.kind,
              placementNamespace: getNamespace(placement),
              clusterNames: getClusterNamesFromPlacement(
                placement,
                plsDecisions
              ),
            },
          });
      }
    }
  });
  return {
    appName,
    appNamespace,
    subscriptionInfo: subscriptionInfo,
  };
};

export const useSubscriptionAppParser: UseSubscriptionAppParser = (
  resource
) => {
  const {
    applications,
    subscriptions,
    placementRules,
    placements,
    placementDecisions,
    loaded,
    loadError,
  } = resource;

  return React.useMemo(() => {
    const subscriptionAppInfo: SubscriptionAppInfo[] = [];
    if (loaded && !loadError) {
      const apps = Array.isArray(applications) ? applications : [applications];
      // namespace wise Application object
      const appToNamespaceMap: ApplicationToNamespaceType = apps?.reduce(
        (arr, application) =>
          subscriptionAppFilter(application)
            ? {
                ...arr,
                [getNamespace(application)]: {
                  ...arr[getNamespace(application)],
                  [getName(application)]: application,
                },
              }
            : arr,
        {}
      );

      // namespace wise Subscription object
      const subsToNamespaceMap: SubscriptionToNamespaceType =
        subscriptions?.reduce(
          (arr, subscription) =>
            getPlacementKind(subscription).includes[
              (ACMPlacementRuleModel?.kind, ACMPlacementModel?.kind)
            ]
              ? {
                  ...arr,
                  [getNamespace(subscription)]: {
                    ...arr[getNamespace(subscription)],
                    [getName(subscription)]: subscription,
                  },
                }
              : arr,
          {}
        );

      // namespace wise PlacementRule object
      const plsRuleToNamespaceMap: PlacementRuleToNamespaceType =
        placements?.reduce(
          (arr, placementRule) => ({
            ...arr,
            [getNamespace(placementRule)]: {
              ...arr[getNamespace(placementRule)],
              [getName(placementRule)]: placementRule,
            },
          }),
          {}
        );

      // namespace wise Placement object
      const plsToNamespaceMap: PlacementToNamespaceType = placements?.reduce(
        (arr, placement) => ({
          ...arr,
          [getNamespace(placement)]: {
            ...arr[getNamespace(placement)],
            [getName(placement)]: placement,
          },
        }),
        {}
      );

      // namespace wise PlacementDecision object
      const plDecisionToNamespaceMap: PlacementDecisionToNamespaceType =
        placementDecisions?.reduce(
          (arr, plDecision) => ({
            ...arr,
            [getNamespace(plDecision)]: {
              ...arr[getNamespace(plDecision)],
              [getName(plDecision)]: plDecision,
            },
          }),
          {}
        );

      Object.keys(appToNamespaceMap).forEach((namespace) => {
        Object.keys(appToNamespaceMap[namespace]).forEach((appName) => {
          subscriptionAppInfo.push(
            generateSubscriptionAppInfo(
              appToNamespaceMap[namespace][appName],
              subsToNamespaceMap,
              plsRuleToNamespaceMap,
              plsToNamespaceMap,
              plDecisionToNamespaceMap
            )
          );
        });
      });
    }
    return subscriptionAppInfo;
  }, [
    applications,
    subscriptions,
    placementRules,
    placements,
    placementDecisions,
    loaded,
    loadError,
  ]);  
};

type SubsAppResourceParserType = {
  applications: ApplicationKind | ApplicationKind[];
  subscriptions: ACMSubscriptionKind[];
  placementRules?: ACMPlacementRuleKind[];
  placements?: ACMPlacementKind[];
  placementDecisions?: ACMPlacementDecisionKind[];
  disasterRecoveryInfo?: DisasterRecoveryInfo[];
  loaded: boolean;
  loadError: boolean;
};

export type UseSubscriptionAppParser = (
  props?: SubsAppResourceParserType
) => SubscriptionAppInfo[];

type ApplicationToNamespaceType = {
  [namespace in string]: {
    [app in string]: ApplicationKind;
  };
};

type SubscriptionToNamespaceType = {
  [namespace in string]: {
    [sub in string]: ACMSubscriptionKind;
  };
};

type PlacementRuleToNamespaceType = {
  [namespace in string]: {
    [plsRule in string]: ACMPlacementRuleKind;
  };
};

type PlacementToNamespaceType = {
  [namespace in string]: {
    [plRule in string]: ACMPlacementKind;
  };
};

type PlacementDecisionToNamespaceType = {
  [namespace in string]: {
    [plDecision in string]: ACMPlacementDecisionKind;
  };
};

type SubscriptionInfo =  Partial<{
  subscriptionName: string;
  subscriptionNamespace: string;
  placementInfo: {
    placementName: string;
    placementNamespace: string;
    placementKind: string;
    clusterNames: string[];
  };
  disasterRecoveryInfo?: DisasterRecoveryInfo;
}>;

export type SubscriptionAppInfo = {
  appName: string;
  appNamespace: string;
  subscriptionInfo: SubscriptionInfo[];
};
