import * as React from 'react';
import { StatusBox } from '@odf/shared/generic/status-box';
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash-es';
import {
  SortByDirection,
  TableComposable,
  Tbody,
  Td,
  Th,
  ThProps,
  Thead,
  Tr,
} from '@patternfly/react-table';
import { useSelectList } from '../hooks/select-list';
import { useSortList } from '../hooks/sort-list';
import { getUID } from '../selectors';

export const sortRows = (
  a: any,
  b: any,
  c: SortByDirection,
  sortField: string
) => {
  const negation = c !== SortByDirection.asc;
  const aValue = _.get(a, sortField, '').toString();
  const bValue = _.get(b, sortField, '');
  const sortVal = String(aValue).localeCompare(String(bValue));
  return negation ? -sortVal : sortVal;
};

const isRowSelectable = <T extends K8sResourceCommon>(row: T) =>
  !row?.metadata?.deletionTimestamp;

const areAllRowsSelected = <T extends K8sResourceCommon>(
  selectableRows: T[],
  selectedRows: T[]
) => {
  const selectedRowIds = selectedRows?.map(getUID);
  const selecteableRowsIds = selectableRows.map(getUID);
  return (
    selecteableRowsIds?.length &&
    selecteableRowsIds.every((rowId) => selectedRowIds?.includes(rowId))
  );
};

const isRowSelected = <T extends K8sResourceCommon>(
  rowId: string,
  selectedRows: T[]
) => selectedRows.some((row) => getUID(row) === rowId);

export const SelectableTable: SelectableTableProps = <
  T extends K8sResourceCommon
>(
  props: TableProps<T>
) => {
  const {
    selectedRows,
    setSelectedRows,
    columns,
    rows,
    RowComponent,
    extraProps,
    isSelectableHidden,
    loaded,
    loadError,
    emptyRowMessage,
  } = props;
  const {
    onSort,
    sortIndex: activeSortIndex,
    sortDirection: activeSortDirection,
    sortedData: sortedRows,
  } = useSortList<T>(rows, columns, false);

  const [selectableRows, rowIds] = React.useMemo(() => {
    const selectableRows = sortedRows?.filter(isRowSelectable) || [];
    const rowIds = new Set(selectableRows?.map(getUID));
    return [selectableRows, rowIds];
  }, [sortedRows]);

  const { onSelect } = useSelectList<T>(
    selectableRows,
    rowIds,
    false,
    setSelectedRows
  );

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection,
    },
    onSort: onSort,
    columnIndex,
  });

  return (
    <StatusBox
      loadError={loadError}
      loaded={loaded}
      EmptyMsg={emptyRowMessage}
      data={sortedRows}
    >
      <TableComposable
        translate={null}
        aria-label="Selectable table"
        variant="compact"
      >
        <Thead translate={null}>
          <Tr translate={null}>
            <Th
              translate={null}
              {...(!isSelectableHidden
                ? {
                    select: {
                      onSelect: onSelect,
                      isSelected: areAllRowsSelected(
                        selectableRows,
                        selectedRows
                      ),
                    },
                  }
                : {})}
            />
            {columns?.map((col, index) => (
              <Th
                {...(!!col?.thProps ? col.thProps : {})}
                {...(!!col?.sortFunction ? { sort: getSortParams(index) } : {})}
                translate={null}
                key={col?.columnName}
              >
                {col?.columnName}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody translate={null}>
          {sortedRows.map((row, rowIndex) => (
            <Tr translate={null} key={getUID(row)}>
              <Td
                translate={null}
                {...(!isSelectableHidden
                  ? {
                      select: {
                        rowIndex,
                        onSelect: onSelect,
                        isSelected: isRowSelected(getUID(row), selectedRows),
                        disable: !isRowSelectable(row),
                        props: {
                          id: getUID(row),
                        },
                      },
                    }
                  : {})}
              />
              <RowComponent row={row} extraProps={extraProps} />
            </Tr>
          ))}
        </Tbody>
      </TableComposable>
    </StatusBox>
  );
};

// Omit ref to resolve incompatible issue
// sort is replaced by sortFunction
type TableThProps = Omit<ThProps, 'sort' | 'ref'>;

export type TableColumnProps = ThProps & {
  thProps?: TableThProps;
  columnName: string;
  sortFunction?: (a: any, b: any, c: SortByDirection) => any;
};

export type RowComponentType<T extends K8sResourceCommon> = {
  row: T;
  extraProps?: any;
};

export type TableProps<T extends K8sResourceCommon> = {
  rows: T[];
  columns: TableColumnProps[];
  RowComponent: React.ComponentType<RowComponentType<T>>;
  selectedRows: T[];
  setSelectedRows: (selectedRows: T[]) => void;
  extraProps?: any;
  // A temporary prop for MCO to hide disable DR
  isSelectableHidden?: boolean;
  loaded: boolean;
  loadError?: any;
  emptyRowMessage?: React.FC;
};

type SelectableTableProps = <T extends K8sResourceCommon>(
  props: React.PropsWithoutRef<TableProps<T>>
) => ReturnType<React.FC>;
