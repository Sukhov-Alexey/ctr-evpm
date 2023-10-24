import { CHART_PARAM, END_PARAM, EVENTS_PARAM, FILTER_PARAM, PAGE_PARAM, PAGE_SIZE_PARAM, RES_PARAM, START_PARAM, TABLE_PARAM } from './consts';
import { RequestError } from './errors';
import { ChartResolution, ChartType, IsValidChartResolution, IsValidChartType, IsValidTableType, MetricsRequestParams, TableRequestParams, TableType } from './types';
import {EOL} from 'os'

export function GetMetricParams(params: URLSearchParams): MetricsRequestParams {
    const result = {} as MetricsRequestParams;
    const errors: string[] = [];

    const typeStr = params.get(CHART_PARAM);
    if (IsValidChartType(typeStr)) {
        result.type = typeStr as ChartType;
    } else {
        errors.push(`Chart Type is not valid or not presented ${typeStr}`);
    }

    const resolutionStr = params.get(RES_PARAM);
    if (IsValidChartResolution(resolutionStr)) {
        result.resolution = resolutionStr as ChartResolution;
    } else {
        errors.push(`Resolution value is not valid or not presented ${resolutionStr}`);
    }

    checkEvents(params, result, errors);

    const startStr = params.get(START_PARAM);
    const endStr = params.get(END_PARAM);
    if (startStr && endStr) {
        result.start = new Date((parseInt(startStr)));
        result.end = new Date(parseInt(endStr));
    } else {
        errors.push(`Dates parameters is not valid or not presented ${startStr} ${endStr}`);
    }

    if (errors.length > 0) {
        throw new RequestError(errors.join(EOL));
    }

    return result;
}

export function GetTableParams(params: URLSearchParams): TableRequestParams {
    const result = {} as TableRequestParams;
    const errors: string[] = [];

    const typeStr = params.get(TABLE_PARAM);
    if (IsValidTableType(typeStr)) {
        result.type = typeStr as TableType;
    } else {
        errors.push(`Chart Type is not valid or not presented ${typeStr}`);
    }

    checkEvents(params, result, errors);

    const filter = params.get(FILTER_PARAM);
    if (filter) {
        result.filter = filter;
    }

    result.page = checkInt(params, PAGE_PARAM, errors);
    result.pageSize = checkInt(params, PAGE_SIZE_PARAM, errors);

    if (errors.length > 0) {
        throw new RequestError(errors.join(EOL));
    }
    return result;
}

function checkEvents(params: URLSearchParams, result: {events: string[]}, errors: string[]) {
    const eventsStr = params.get(EVENTS_PARAM);
    if (eventsStr) {
        result.events = eventsStr.split(';');
    }  else {
        errors.push(`Events list is not valid or not presented ${eventsStr}`);
    }
}

function checkInt(params:URLSearchParams, param: string, errors: string[]): number {
    const paramStr = params.get(param);
    const errorStr = `Value of ${param} is not valid number ${paramStr}`
    try {
        const num = Number(paramStr);
        if (isNaN(num)) {
            errors.push(errorStr);    
        }
        return num;
    } catch (error) {
        errors.push(errorStr);
        return NaN;
    }
}