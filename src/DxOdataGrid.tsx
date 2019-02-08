import * as React from "react";

import {
  CustomPaging,
  PagingState,
  SortingState,
  TableColumnResizingProps,
  FilteringState,
  Filter,
  Column,
  Sorting
} from "@devexpress/dx-react-grid";

import {
  Grid,
  PagingPanel,
  Table,
  TableHeaderRow,
  TableFilterRow,
  TableColumnResizing
  // tslint:disable-next-line:no-implicit-dependencies
} from "@devexpress/dx-react-grid-bootstrap3";

import {
  useOdata,
  FilterOperand,
  DataType,
  OdataFilter
} from "@jbuschke/react-odata";
import { useState } from "react";
import { useRemoteJson } from "./useRemoteJson";
import { Spin } from "antd";

export interface IOdataListProps {
  columns: Column[];
  additionalParameters?: string[];
  odataPath: string;
  expand?: string;
  tableColumnResizingProps?: TableColumnResizingProps;
  filters?: Filters;
  rowComponent?: any;
}

export interface FilterValue {
  operand?: FilterOperand;
  dataType?: DataType;
  disabled?: boolean;
  initialValue?: string;
}

export interface Filters {
  [name: string]: FilterValue;
}

const getRowId = (row: any) => row.id;

const toOdataFilter = (
  filters: Filter[],
  filterProps: Filters
): OdataFilter[] =>
  filters
    .map(
      v =>
        ({
          name: v.columnName,
          dataType: filterProps[v.columnName]
            ? filterProps[v.columnName].dataType
            : "string",
          operand: filterProps[v.columnName]
            ? filterProps[v.columnName].operand
            : "equals",
          value: v.value!
        } as OdataFilter)
    )
    .filter(v => v.value);

export const List = ({
  additionalParameters,
  columns,
  expand,
  odataPath,
  tableColumnResizingProps,
  rowComponent,
  filters = {}
}: IOdataListProps) => {
  const { query, setSkip, setTop, setFilters, setOrderBy } = useOdata();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [gridFilters, setGridFilters] = useState<Filter[]>([]);
  const [filterColumnExtensions, setFilterColumnExtensions] = useState<
    FilteringState.ColumnExtension[]
  >([]);
  const [sorting, setSorting] = useState<Sorting[]>([]);
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
          filteringEnabled: !filters[column].disabled!
        }))
      );
    }
  }, []);

  const { data, loading, error } = useRemoteJson(
    `${odataPath}?api-version=1.0&$count=true&${query}${
      expand ? `&$expand=${expand}` : ""
    }${
      additionalParameters
        ? additionalParameters.reduce((prev, curr) => `${prev}&${curr}`, "&")
        : ""
    }`
  );

  if (error) {
    return <div>ERROR: {error}</div>;
  }
  return (
    <Spin spinning={loading} delay={data ? 150 : 0}>
      <Grid
        rows={data ? (data.value ? data.value : []) : []}
        columns={columns || []}
        getRowId={getRowId}
      >
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
              sorting.map(v => ({ name: v.columnName, direction: v.direction }))
            );
          }}
        />
        <PagingState
          currentPage={page}
          onCurrentPageChange={(currentPage: number) => {
            setPage(currentPage);
            setSkip(pageSize * currentPage);
            setTop(pageSize);
          }}
          pageSize={pageSize}
          onPageSizeChange={(newPageSize: number) => {
            setPageSize(newPageSize);
            setSkip(newPageSize * page);
            setTop(newPageSize);
          }}
        />
        {rowComponent ? <Table rowComponent={rowComponent} /> : <Table />}
        <CustomPaging totalCount={data ? data["@odata.count"] : undefined} />
        {tableColumnResizingProps && (
          <TableColumnResizing {...tableColumnResizingProps} />
        )}
        <TableHeaderRow showSortingControls={true} />
        <TableFilterRow />
        <PagingPanel pageSizes={[10, 20, 50]} />
      </Grid>
    </Spin>
  );
};
