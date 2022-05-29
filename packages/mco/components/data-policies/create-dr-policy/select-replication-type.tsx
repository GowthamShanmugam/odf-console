import * as React from 'react';
import { useCustomTranslation } from '@odf/shared/useCustomTranslationHook';
import {
  FormGroup,
  TextInput,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  InputGroup,
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { ODF_MINIMUM_SUPPORT, REPLICATION_TYPE } from '../../../constants';
import { DRPolicyState, DRPolicyAction, DRPolicyActionType } from './reducer';

type SyncScheduleProps = {
  state: DRPolicyState;
  dispatch: React.Dispatch<DRPolicyAction>;
};

const SyncSchedule: React.FC<SyncScheduleProps> = ({ state, dispatch }) => {
  const { t } = useCustomTranslation();

  const SyncSchedule = {
    minutes: t('minutes'),
    hours: t('hours'),
    days: t('days'),
  };
  const SCHEDULE_FORMAT = {
    [SyncSchedule.minutes]: 'm',
    [SyncSchedule.hours]: 'h',
    [SyncSchedule.days]: 'd',
  };

  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState(
    SyncSchedule.minutes
  );

  const setSyncSchedule = (time: string, format?: string) =>
    dispatch({
      type: DRPolicyActionType.SET_SYNC_TIME,
      payload: `${time}${SCHEDULE_FORMAT[format ?? selectedFormat]}`,
    });

  const onSelect = (event) => {
    const scheduleTime = state.syncTime.match(/\d+/g)[0];
    const newScheduleFormat = event.target.value;
    setIsOpen(false);
    setSelectedFormat(newScheduleFormat);
    setSyncSchedule(scheduleTime, newScheduleFormat);
  };

  return (
    <InputGroup>
      <TextInput
        id="sync-schedule"
        data-test="sync-schedule-text"
        defaultValue="5"
        type="number"
        onChange={(scheduleTime) => setSyncSchedule(scheduleTime)}
        isRequired
      />
      <Dropdown
        data-test="sync-schedule-dropdown"
        aria-label={t('Select schedule time format in minutes, hours or days')}
        onSelect={onSelect}
        toggle={
          <DropdownToggle
            onToggle={(open) => setIsOpen(open)}
            data-test="sync-schedule-dropdown-toggle"
          >
            {selectedFormat}
          </DropdownToggle>
        }
        isOpen={isOpen}
        dropdownItems={[
          <DropdownItem
            data-test="sync-schedule-minutes-dropdown-item"
            key="minutes"
            value={SyncSchedule.minutes}
            component="button"
          >
            {SyncSchedule.minutes}
          </DropdownItem>,
          <DropdownItem
            data-test="sync-schedule-hours-dropdown-item"
            key="hours"
            value={SyncSchedule.hours}
            component="button"
          >
            {SyncSchedule.hours}
          </DropdownItem>,
          <DropdownItem
            data-test="sync-schedule-days-dropdown-item"
            key="days"
            value={SyncSchedule.days}
            component="button"
          >
            {SyncSchedule.days}
          </DropdownItem>,
        ]}
      />
    </InputGroup>
  );
};

type DRReplicationTypeProps = {
  state: DRPolicyState;
  dispatch: React.Dispatch<DRPolicyAction>;
};

export const DRReplicationType: React.FC<DRReplicationTypeProps> = ({
  state,
  dispatch,
}) => {
  const { t } = useCustomTranslation();
  const [isReplicationOpen, setReplicationOpen] = React.useState(false);

  const replicationDropdownItems = Object.values(REPLICATION_TYPE(t)).map(
    (replType) => (
      <DropdownItem
        isDisabled={!state.isReplicationInputManual}
        key={replType}
        component="button"
        id={replType}
        data-test="replication-dropdown-item"
        onClick={() =>
          dispatch({
            type: DRPolicyActionType.SET_REPLICATION,
            payload: replType,
          })
        }
      >
        {replType}
      </DropdownItem>
    )
  );

  return (
    <>
      {state.isODFDetected ? (
        <>
          {state.replication && (
            <FormGroup
              fieldId="replication-policy"
              label={t('Replication policy')}
            >
              <Dropdown
                data-test="replication-dropdown"
                className="mco-create-data-policy__dropdown"
                onSelect={() => setReplicationOpen(false)}
                toggle={
                  <DropdownToggle
                    data-test="replication-dropdown-toggle"
                    isDisabled={!state.isReplicationInputManual}
                    className="mco-create-data-policy__dropdown"
                    id="toggle-id"
                    onToggle={() => setReplicationOpen(!isReplicationOpen)}
                    toggleIndicator={CaretDownIcon}
                  >
                    {state.replication}
                  </DropdownToggle>
                }
                isOpen={isReplicationOpen}
                dropdownItems={replicationDropdownItems}
              />
            </FormGroup>
          )}
          {state.replication === REPLICATION_TYPE(t).async && (
            <FormGroup fieldId="sync-schedule" label={t('Sync schedule')}>
              <SyncSchedule state={state} dispatch={dispatch} />
            </FormGroup>
          )}
        </>
      ) : !state.errorMessage && (
        Object.values(state.selectedClusters)?.map((c) =>
          c.subscriptionLoaded && !c?.isValidODFVersion ? (
            <Alert
              data-test="odf-not-found-alert"
              className="co-alert mco-create-data-policy__alert"
              title={t(
                '{{ name }} has invalid ODF version, update to ODF {{ version }} or latest version to enable DR protection',
                { name: c?.name, version: ODF_MINIMUM_SUPPORT }
              )}
              variant={AlertVariant.danger}
              isInline
            />
          ) : (
            c?.cephClusterName === '' &&
            c.cephClusterLoaded && (
              <Alert
                data-test="rhcs-not-found-alert"
                className="co-alert mco-create-data-policy__alert"
                title={t('{{ name }} is not connected to RHCS', {
                  name: c?.name,
                })}
                variant={AlertVariant.danger}
                isInline
              />
            )
          )
        )
      )}
    </>
  );
};
