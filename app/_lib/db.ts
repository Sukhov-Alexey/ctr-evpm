import { ClickHouseClient, createClient } from '@clickhouse/client';
import { NodeClickHouseClientConfigOptions } from '@clickhouse/client/dist/client';
import { readFileSync } from 'fs';

export const getClient = (): ClickHouseClient => {
  const clientOptions = {
    host: process.env.DB_HOST,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  } as NodeClickHouseClientConfigOptions;

  if (process.env.DB_USE_SSL) {
    clientOptions.tls = {
      ca_cert: readFileSync('RootCA.pem')
    };
  }

  return createClient(clientOptions);
};