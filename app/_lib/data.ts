import { getClient } from './db';
import { ChResponse} from './types';

export async function GetListOfEvents(): Promise<string[]> {
    const eventsRequest = `
        SELECT DISTINCT (tag)
        FROM events;
    `;
    const eventsResponse = await getClient().query({query: eventsRequest});
    const events = ((await eventsResponse.json()) as ChResponse).data as unknown as {tag: string}[];
    return events.map(x=>x.tag);
}

export async function GetLastDate(): Promise<number> {
    const request = `
        SELECT max(reg_time) as lastDate
        FROM impressions;
    `;

    const response = await getClient().query({query: request});
    const lastDate = ((await response.json()) as ChResponse).data as unknown as {lastDate: Date}[]
    return lastDate.length > 0 ? new Date(lastDate[0].lastDate).getTime() : Date.now();
}