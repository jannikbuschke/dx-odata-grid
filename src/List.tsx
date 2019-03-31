import * as React from "react";

import {
  CustomPaging,
  PagingState,
  SortingState,
  TableColumnResizingProps,
  FilteringState,
  Filter,
  Column,
  Sorting,
  DataTypeProvider,
  FilterExpression,
  GroupingState,
  IntegratedGrouping
} from "@devexpress/dx-react-grid";

import {
  Grid,
  PagingPanel,
  Table,
  TableHeaderRow,
  TableFilterRow,
  TableColumnResizing,
  TableGroupRow
  // tslint:disable-next-line:no-implicit-dependencies
} from "@devexpress/dx-react-grid-bootstrap3";

import {
  useOdata,
  FilterOperation,
  DataType as filterDisabled,
  OdataFilter
} from "@jbuschke/react-odata";
import { useState } from "react";
import { useRemoteJson } from "./useRemoteJson";
import { Spin, Alert } from "antd";

interface ListColumn extends Column, FilterValue {}

export interface IOdataListProps {
  getRowId?: (row: any) => any;
  columns: ListColumn[];
  additionalParameters?: string[];
  odataPath: string;
  expand?: string;
  tableColumnResizingProps?: TableColumnResizingProps;
  rowComponent?: any;
  paginate?: boolean;
  initialSorting?: Sorting[];
  initialPageSize?: number;
  showFilters?: boolean;
  showTitles?: boolean;
  showFilterSelector?: boolean;
  groupBy?: string[];
  addHeaders?: () => Promise<HeadersInit>;
}

export interface FilterValue {
  filterOperand?: FilterOperation;
  filterOperations?: FilterOperation[];
  dataType?: filterDisabled;
  filterDisabled?: boolean;
  initialValue?: string;
  name: string;
}

export interface Filters {
  [name: string]: FilterValue;
}

const defaultGetRowId = (row: any) => row.id;

const toOdataFilter = (
  filters: Filter[],
  filterProps: Filters
): OdataFilter[] => {
  return filters
    .map(
      v =>
        ({
          name: v.columnName,
          dataType: filterProps[v.columnName]
            ? filterProps[v.columnName].dataType
            : "string",
          operation: v.operation,
          value: v.value!
        } as OdataFilter)
    )
    .filter(v => v.value);
};

export const List = ({
  groupBy,
  getRowId,
  additionalParameters,
  columns,
  expand,
  odataPath,
  tableColumnResizingProps,
  rowComponent,
  paginate = true,
  initialSorting = [],
  showFilters = true,
  showTitles = true,
  initialPageSize,
  addHeaders,
  showFilterSelector
}: IOdataListProps) => {
  const { query, setSkip, setTop, top, setFilters, setOrderBy } = useOdata({
    initialPageSize,
    initialOrderBy: initialSorting.map(v => ({
      name: v.columnName,
      direction: v.direction
    }))
  });

  const filterValues: FilterValue[] = columns.map(
    (v): FilterValue => ({
      name: v.name,
      dataType: v.dataType,
      filterDisabled: v.filterDisabled,
      initialValue: v.initialValue,
      filterOperand: v.filterOperand
    })
  );

  const filters: Filters = {};
  filterValues.forEach(v => (filters[v.name] = v));

  // should be computed from top/skip
  const [page, setPage] = useState(0);

  const [gridFilters, setGridFilters] = useState<Filter[]>([]);
  const [filterColumnExtensions, setFilterColumnExtensions] = useState<
    FilteringState.ColumnExtension[]
  >([]);
  const [sorting, setSorting] = useState<Sorting[]>(initialSorting);
  React.useEffect(() => {
    if (filters) {
      const gridFilters = Object.keys(filters).map(column => ({
        columnName: column,
        value: filters[column].initialValue
      }));
      setGridFilters(gridFilters);
      setFilters(toOdataFilter(gridFilters, filters));
      setFilterColumnExtensions(
        Object.keys(filters).map(column => ({
          columnName: column,
          filteringEnabled: !filters[column].filterDisabled!
        }))
      );
    }
  }, []);

  const { data, loading, error } = useRemoteJson(
    `${odataPath}?api-version=1.0${paginate ? "&$count=true" : ""}&${query}${
      expand ? `&$expand=${expand}` : ""
    }${
      additionalParameters
        ? additionalParameters.reduce((prev, curr) => `${prev}&${curr}`, "&")
        : ""
    }`,
    {},
    addHeaders
  );

  return (
    <Spin spinning={loading} delay={data ? 150 : 0}>
      {error ? (
        <Alert
          message={error}
          showIcon={false}
          type="error"
          closable={true}
          banner={true}
          style={{ marginBottom: 10 }}
        />
      ) : (
        <Grid
          rows={data && data.value ? data.value : []}
          columns={columns || []}
          getRowId={getRowId ? getRowId : defaultGetRowId}
        >
          {columns
            .filter(v => v.filterOperations)
            .map(v => (
              <DataTypeProvider
                for={[v.name]}
                availableFilterOperations={v.filterOperations}
              />
            ))}
          <FilteringState
            filters={gridFilters}
            onFiltersChange={(gridFilters: Filter[]) => {
              setGridFilters(gridFilters);
              setFilters(toOdataFilter(gridFilters, filters!));
            }}
            columnExtensions={filterColumnExtensions}
          />
          <SortingState
            sorting={sorting || []}
            onSortingChange={sorting => {
              setSorting(sorting);
              setOrderBy(
                sorting.map(v => ({
                  name: v.columnName,
                  direction: v.direction
                }))
              );
            }}
          />
          {groupBy && data && data.value ? (
            <GroupingState
              grouping={groupBy.map(v => ({ columnName: v }))}
              expandedGroups={Array.from(
                new Set(data.value.map((v: any) => "" + v.weekInYear))
              )}
            />
          ) : (
            <GroupingState />
          )}
          {groupBy && <IntegratedGrouping />}
          <PagingState
            currentPage={page}
            onCurrentPageChange={(currentPage: number) => {
              setPage(currentPage);
              setSkip(top * currentPage);
            }}
            pageSize={top}
            onPageSizeChange={(newPageSize: number) => {
              setSkip(newPageSize * page);
              setTop(newPageSize);
            }}
          />
          {rowComponent ? <Table rowComponent={rowComponent} /> : <Table />}
          <CustomPaging totalCount={data ? data["@odata.count"] : undefined} />
          {tableColumnResizingProps && (
            <TableColumnResizing {...tableColumnResizingProps} />
          )}
          {showTitles && <TableHeaderRow showSortingControls={true} />}
          {showFilters && (
            <TableFilterRow showFilterSelector={showFilterSelector} />
          )}
          {groupBy && <TableGroupRow />}
          {paginate && <PagingPanel pageSizes={[10, 20, 50]} />}
        </Grid>
      )}
    </Spin>
  );
};
