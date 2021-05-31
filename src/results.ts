import { Coinbase } from './coinbase';
import {
  CoinbasePagination,
  CoinbaseSuccessResponse,
  ListOrder,
} from './coinbase.types';
import { JsonObject } from './webClient.types';

export class PaginatedResult<T extends JsonObject> {
  constructor(
    public readonly data: T[],
    private pagination: CoinbasePagination,
    private coinbase: Coinbase
  ) {}

  public async nextPage(): Promise<PaginatedResult<T> | undefined> {
    const { next_uri } = this.pagination;
    if (next_uri) {
      const { data, pagination } = await this.listRequest(next_uri);
      return new PaginatedResult(data, pagination, this.coinbase);
    }
  }

  public async previousPage(): Promise<PaginatedResult<T> | undefined> {
    const { previous_uri } = this.pagination;
    if (previous_uri) {
      const { data, pagination } = await this.listRequest(previous_uri);
      return new PaginatedResult(data, pagination, this.coinbase);
    }
  }

  public hasNext(): boolean {
    return !!this.pagination.next_uri;
  }

  public hasPrevious(): boolean {
    return !!this.pagination.previous_uri;
  }

  get order(): ListOrder {
    return this.pagination.order;
  }

  private async listRequest(
    uri: string
  ): Promise<{ data: T[]; pagination: CoinbasePagination }> {
    const listResponse = (await this.coinbase.request({
      method: 'GET',
      path: uri,
    })) as CoinbaseSuccessResponse;

    const { pagination } = listResponse;

    if (!pagination) {
      throw new Error('Unexpected result: no pagination object was returned');
    }

    let { data } = listResponse;

    if (!Array.isArray(data)) {
      data = [data];
    }

    return { data: data as T[], pagination };
  }
}
