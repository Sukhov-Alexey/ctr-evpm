
export function createEventsQueryParams(events: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    events.forEach((event, index) => {
        result[`event${index}`] = event;
    });
    return result;
}