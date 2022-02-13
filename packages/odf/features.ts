import { SetFeatureFlag } from "@openshift-console/dynamic-plugin-sdk";
import * as _ from 'lodash';
import { k8sList, k8sGet } from '@openshift-console/dynamic-plugin-sdk';
import { AcmMultiClusterObservabilityModel, ConfigMapModel } from '../odf/models';
import { MultiClusterObservability, ConfigMapKind } from '@odf/shared/types';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk-internal-kubevirt/lib/api/common-types';
// export type FeatureDetector = (setFeatureFlag: SetFeatureFlag) => Promise<any>;
import  { load } from "js-yaml"

const ODF_MODEL_FLAG = 'ODF_MODEL';
const ACM_MODEL_FLAG = 'ACM';

export const setODFFlag = (setFlag: SetFeatureFlag) => setFlag(ODF_MODEL_FLAG, true);

export const detectRGW = async (setFeatureFlag: SetFeatureFlag) => {
  let id = null;
  let isInitial = true;
  let mcokind: K8sModel = {...AcmMultiClusterObservabilityModel}
  let configMapkind: K8sModel = {...ConfigMapModel}

  const logicHandler = (() =>{
    k8sList({model: mcokind, queryParams: {}})
      .then((data: MultiClusterObservability[]) => {
        const isEnabled = data.some((mco) => mco.status?.conditions[1]?.status == "True");
        if (isEnabled) {
          k8sGet({model: configMapkind, name: "observability-metrics-custom-allowlist", ns: "open-cluster-management-observability"}).then((data: ConfigMapKind) => {
            const metrics = load(data.data["metrics_list.yaml"]);
            const names: string[] = metrics["names"]
            if (names.includes("odf_system_map")){
                setFeatureFlag(ACM_MODEL_FLAG, true);
                //clearInterval(id);
            }
          }).catch((error) => {

          });
        } else {
          if (isInitial === true) {
            setFeatureFlag(ACM_MODEL_FLAG, false);
            isInitial = false;
          }
        }
      })
      .catch((error) => {
        if (error?.response instanceof Response) {
          const status = error?.response?.status;
          if (_.includes([403, 502], status)) {
            setFeatureFlag(ACM_MODEL_FLAG, false);
            clearInterval(id);
          }
          if (!_.includes([401, 403, 500], status) && isInitial === true) {
            setFeatureFlag(ACM_MODEL_FLAG, false);
            isInitial = false;
          }
        } else {
          clearInterval(id);
        }
      });
    })
  id = setInterval(logicHandler, 15 * 1000);
}