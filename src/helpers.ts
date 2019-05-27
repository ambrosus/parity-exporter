import * as http from 'http';
import * as axios from 'axios';
import * as express from 'express';
import { Registry } from 'prom-client';

const httpClient = axios.default.create({
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
});

export function validateConfig(config: any): void {
  const regexpNumber = /^\d+$/;
  const regexpValidUrl = /^(http|https):\/\/(([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9\-]*[a-z0-9])(:[0-9]+)?$/;

  if (!regexpNumber.test(config.port)) {
    throw new Error(`Port should be a number, got ${config.port}`);
  } else if (!regexpValidUrl.test(config.rpcUrl)) {
    throw new Error(
      `RpcUrl should be a valid url including http/https, got ${config.rpcUrl}`
    );
  }
}

export interface IConfig {
  port: string;
  rpcUrl: string;
}

export type ICreateMetrics = (
  register?: Registry,
  node?: string
) => Promise<void>;

type IHttpRequest = (req: express.Request, res: express.Response) => void;

export interface IPrometheusClient {
  createMetrics: ICreateMetrics;
  serveMetrics: IHttpRequest;
}

export async function makeRequest(
  url: string,
  method: string,
  params: string[] = []
): Promise<any> {
  try {
    const response = await httpClient({
      url: url,
      method: 'post',
      data: {
        jsonrpc: '2.0',
        method,
        params,
        id: 42
      }
    });
    if (method === 'parity_netPeers') {
      console.log(method, ' -> ', response.data);
    }
    if (response.data.error != null) {
      console.log(method, ' -> ', response.data.error.message);
    }
    return response.data.result;
  } catch (error) {
    return false;
  }
}
