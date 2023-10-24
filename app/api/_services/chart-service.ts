import { getClient } from '@/app/_lib/db';
import { 
    ChResponse,
    ChartResolution, 
    ChartType, 
    ImpEventData, 
    LabelValue, 
    MetricsRequestParams} from '@/app/_lib/types';
import { QueryParams } from '@clickhouse/client';
import { createEventsQueryParams } from './utils';

export async function GetChartData({resolution, events, type, start, end}: MetricsRequestParams) {
    const pointsQuery = formatQuery({resolution, events, type, start, end});

    const pointsResponse = await getClient().query(pointsQuery);
    const pointsData = ((await pointsResponse.json()) as ChResponse).data as unknown as ImpEventData[];
    return formatResponse(pointsData);
}

const INTERVAL_MAP = new Map<ChartResolution, string>([
    [ChartResolution.Hour, '2 MINUTE'],
    [ChartResolution.Day, '1 HOUR'],
    [ChartResolution.Week, '12 HOUR'],
    [ChartResolution.TwoWeeks, '1 DAY'],
    [ChartResolution.Month, '2 DAY']
]);

const METRIC_MAP = new Map<ChartType, string> ([
    [ChartType.CTR, 'multiply(100, divide(ev_count, total))'],
    [ChartType.EvPM, 'multiply(1000, divide(ev_count, total))'] 
]);

function formatQuery({resolution, events, type, start, end}: MetricsRequestParams): QueryParams {
    const interval = INTERVAL_MAP.get(resolution);
    const metricExpression = METRIC_MAP.get(type);
    const query_params = createEventsQueryParams(events);
    const oneOfTags = Object.keys(query_params).map(paramName => `tag={${paramName}: String}`).join(' OR ');
    
    const query = `
        SELECT toStartOfInterval(reg_time, INTERVAL ${interval}) as sp, 
            plus(sp, INTERVAL ${interval}) as ep, 
            count(*) as total, 
            countIf(${oneOfTags}) as ev_count, 
            ${metricExpression} as metric
        FROM impressions LEFT OUTER JOIN events ON impressions.uid = events.uid
        WHERE sp >= toStartOfInterval(toDateTime(${start.getTime()/1000}), INTERVAL ${interval}) and  ep <= plus(toStartOfInterval(toDateTime(${end.getTime()/1000}), INTERVAL ${interval}), INTERVAL ${interval})
        GROUP BY sp
        ORDER BY sp ASC`;
    return {query, query_params};
}

function formatResponse(data: ImpEventData[]) {
    return data.map(x=> {
        return {
            label: x.sp.replace(' ', 'T') + 'Z', // else js will parse the date string in the local timezone, which cause bugs
            value: x.metric
        } as unknown as LabelValue
    });
}
