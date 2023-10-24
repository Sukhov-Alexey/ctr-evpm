import { NextResponse } from 'next/server';
import { RequestError } from './errors';

export function catchErrors() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalFunc = descriptor.value as Function;
      
        descriptor.value = async (...args: []) => {
            if (args.length === 0) { 
                return; 
            }
        
            try {
                return await originalFunc.apply(target, args);
            } catch (error: any) {
                console.error(error);
                let status = 500;
                if (error instanceof RequestError) {
                    status = (error as RequestError).code;
                }
                return new NextResponse(null, {status});
            }
        }
    }

}