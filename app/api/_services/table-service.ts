import { getClient } from '@/app/_lib/db';
import { ChResponse, TableData, TableRequestParams, TableResponse, TableType } from '@/app/_lib/types';
import { QueryParams } from '@clickhouse/client';
import { createEventsQueryParams } from './utils';

export async function GetTableData({events, type, filter, page, pageSize}:TableRequestParams): Promise<TableResponse> {
    const query = formatQuery({events, type, filter, page, pageSize})

    const tableResponse = await getClient().query(query);
    const tableData = await tableResponse.json() as ChResponse;
    
    return formatResponse(tableData, pageSize);
}

const TABLE_MAP = new Map<TableType, string>([
    [TableType.DMA, 'dma_metrics'],
    [TableType.Site, 'site_metrics']
]);

function formatQuery({events, type, filter, page, pageSize}: TableRequestParams): QueryParams {
    const tableName = TABLE_MAP.get(type);

    const filteredEvents = events.filter(x=> !x.startsWith('v'));
    const events_query_params = createEventsQueryParams(filteredEvents);

    const eventsVariables = Object.keys(events_query_params);
    let columnSum = `{${eventsVariables.shift()}: Identifier}`;

    if (eventsVariables.length > 0)  {
        columnSum = eventsVariables.reduce((acc, value)=>`sum(${acc}, {${value}: Identifier})`, columnSum);
    }

    const query_params = {
        'search' : `%${filter || ''}%`
    }
    Object.assign(query_params, events_query_params);

    const query = `
        SELECT 
            ${type} as target,
            multiply(100,divide(fclick, total)) as ctr,
            multiply(1000, divide(${columnSum}, total)) as evpm,
            total
        FROM ${tableName}
        WHERE toString(target) ILIKE {search: String}
        LIMIT ${pageSize} OFFSET ${pageSize * page}`;

    return {query, query_params};
}

function formatResponse(response: ChResponse, pageSize: number): TableResponse {

    const roundNumber = (num:number): number => {
        return Math.round((num + Number.EPSILON) * 100) / 100;
    }

    const rowsCount = response.rows_before_limit_at_least as number;
    const result: TableData[] = [];
    response.data.forEach((element: TableData) => {
        result.push({
            target: element.target,
            ctr: roundNumber(element.ctr),
            evpm: roundNumber(element.evpm),
            total: element.total
        } as TableData);
    });
    return {data: result, totalPages: Math.ceil(rowsCount / pageSize)};
}