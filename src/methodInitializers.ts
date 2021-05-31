import { Coinbase } from "./coinbase";
import { CoinbaseResultObject } from "./coinbase.types";
import { JsonObject, RequestMethod } from "./webClient.types";

export type ApiMethod<
  Result extends CoinbaseResultObject
> = () => Promise<Result>;

type ApiMethodWithArgs<
  Result extends CoinbaseResultObject,
  Arguments extends JsonObject
> = (args: Arguments) => Promise<Result>;

type ApiMethodWithOptionalArgs<
  Result extends CoinbaseResultObject,
  Arguments extends JsonObject
> = (args?: Arguments) => Promise<Result>;

export function createMethod<Result extends CoinbaseResultObject>(
  instance: Coinbase,
  requestMethod: RequestMethod,
  path: string,
  auth = true
): ApiMethod<Result> {
  return () =>
    instance.apiRequest(
      {
        method: requestMethod,
        path,
      },
      auth
    ) as Promise<Result>;
}

export function createMethodWithArgs<
  Result extends CoinbaseResultObject,
  Arguments extends JsonObject
>(
  instance: Coinbase,
  requestMethod: RequestMethod,
  path: string,
  auth = true
): ApiMethodWithArgs<Result, Arguments> {
  return (args: Arguments) =>
    instance.apiRequest(
      {
        method: requestMethod,
        path,
        args,
      },
      auth
    ) as Promise<Result>;
}

export function createMethodWithOptionalArgs<
  Result extends CoinbaseResultObject,
  Arguments extends JsonObject
>(
  instance: Coinbase,
  requestMethod: RequestMethod,
  path: string,
  auth = true
): ApiMethodWithOptionalArgs<Result, Arguments> {
  return (args?: Arguments): Promise<Result> =>
    instance.apiRequest(
      {
        method: requestMethod,
        path,
        args,
      },
      auth
    ) as Promise<Result>;
}
