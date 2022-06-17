import { ODF_OPERATOR } from '@odf/shared/constants';
import { ClusterServiceVersionKind } from '@odf/shared/types';
import { K8sResourceKind } from '@odf/shared/types';
import { StorageClassResourceKind } from '@odf/shared/types';
import { isDefaultClass } from '@odf/shared/utils';
import * as _ from 'lodash';
import { ODF_VENDOR_ANNOTATION } from '../constants';

export const getSupportedVendors = (
  csv: ClusterServiceVersionKind
): string[] => {
  const annotations = csv?.metadata?.annotations?.[ODF_VENDOR_ANNOTATION];
  return annotations ? JSON.parse(annotations) : [];
};

export const getExternalSubSystemName = (
  name: string = '',
  storageClassName: string
) =>
  `${name.toLowerCase().replace(/\s/g, '-')}-${storageClassName}`.substring(
    0,
    230
  );

export const getStorageClassDescription = (
  sc: StorageClassResourceKind
): string => {
  const descriptionList = [sc.provisioner, sc.parameters?.type];
  return descriptionList.reduce(
    (description, dl) => {
      if (dl) return description ? `${description} | ${dl}` : dl;
      return description;
    },
    isDefaultClass(sc) ? '(default)' : ''
  );
};

export const getOperatorVersion = (operator: K8sResourceKind): string =>
  operator?.status?.installedCSV;

export const getODFVersion = (items: K8sResourceKind[]): string => {
  const operator: K8sResourceKind = _.find(
    items,
    (item) => item?.spec?.name === ODF_OPERATOR
  );
  return getOperatorVersion(operator);
};
