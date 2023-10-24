import { catchErrors } from '@/app/_lib/decorators';
import { GetTableParams } from '@/app/_lib/requests';
import { NextRequest, NextResponse } from 'next/server';
import { GetTableData } from '../_services/table-service';

class TableRoute {
    @catchErrors()
    async GET(req: NextRequest) {
        const params = GetTableParams(req.nextUrl.searchParams);
        const tableResponse = await GetTableData(params);
        return NextResponse.json(tableResponse);
    }
}

const tableRoute = new TableRoute();
export const GET = tableRoute.GET;