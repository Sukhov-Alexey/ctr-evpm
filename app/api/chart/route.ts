import { catchErrors } from '@/app/_lib/decorators';
import { GetMetricParams } from '@/app/_lib/requests';
import { NextRequest, NextResponse } from 'next/server';
import { GetChartData } from '../_services/chart-service';

class MetricsRoute {
    @catchErrors()
    async GET(req: NextRequest) {
        const requestParams = GetMetricParams(req.nextUrl.searchParams);
    
        const result = await GetChartData(requestParams);
        return NextResponse.json(result);
    }
}

const metricRoute = new MetricsRoute;
export const GET = metricRoute.GET;