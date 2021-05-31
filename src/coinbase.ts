import { createHmac } from "crypto";
import fetch from "node-fetch";
import {
  Account,
  CoinbaseOptions,
  PriceResult,
  GetPriceArguments,
  CoinbaseRequestArguments,
  Time,
  GetSpotPriceArguments,
  GetExchangeRatesArguments,
  Currency,
  GetExchangeRatesResult,
  Sell,
  Buy,
  AccountIdArguments,
  ShowSellArguments,
  ShowBuyArguments,
  CoinbaseSuccessResponse,
  CoinbaseResultObject,
  PaginationArguments,
  ListSellsArguments,
  ListBuysArguments,
  Transaction,
  ListTransactionArguments,
  ShowTransactionArguments,
  PlaceOrderArguments,
  UpdateAccountArguments,
  OAuthAccessTokenResult,
  OAuthAccessTokenArguments,
  ApiKeyOptions,
  OAuthOptions,
  User,
} from "./coinbase.types";
import {
  createMethodWithArgs,
  createMethodWithOptionalArgs,
  createMethod,
} from "./methodInitializers";
import { PaginatedResult } from "./results";
import { JsonCollection, JsonObject } from "./webClient.types";

class RequestError extends Error {
  constructor(public status: number, public messages: string[] = []) {
    super();
  }
}

const API_URL = "https://api.coinbase.com";

export class Coinbase {
  constructor(public readonly options?: CoinbaseOptions) {}

  public readonly wallet = {
    /**
     * Get current user’s public information.
     *
     * To get user’s email or private information, use permissions `wallet:user:email` and `wallet:user:read`.
     * If current request has a `wallet:transactions:send` scope, then the response will contain a boolean
     * `sends_disabled` field that indicates if the user’s send functionality has been disabled.
     */
    showCurrentUser: <T extends User = User>(): Promise<T> =>
      createMethod<T>(this, "GET", "/v2/user", true)(),
    /**
     * Lists current user’s accounts to which the authentication method has access to.
     */
    listAccounts: createMethodWithOptionalArgs<
      PaginatedResult<Account>,
      PaginationArguments
    >(this, "GET", "/v2/accounts"),
    /**
     * Show current user’s account. To access the primary account for a given currency,
     * a currency string (BTC or ETH) can be used instead of the account id in the URL.
     */
    showAccount: createMethodWithArgs<Account, AccountIdArguments>(
      this,
      "GET",
      "/v2/accounts/:account_id"
    ),
    /**
     * Modifies user’s account.
     */
    updateAccount: createMethodWithArgs<Account, UpdateAccountArguments>(
      this,
      "PUT",
      "/v2/accounts/:account_id"
    ),
    /**
     * Lists account’s transactions.
     */
    listTransactions: createMethodWithArgs<
      PaginatedResult<Transaction>,
      ListTransactionArguments
    >(this, "GET", "/v2/accounts/:account_id/transactions"),
    /**
     * Show an individual transaction for an account.
     */
    showTransaction: createMethodWithArgs<
      Transaction,
      ShowTransactionArguments
    >(this, "GET", "/v2/accounts/:account_id/transactions/:transaction_id"),

    /**
     * Lists sells for an account.
     */
    listSells: createMethodWithArgs<PaginatedResult<Sell>, ListSellsArguments>(
      this,
      "GET",
      "/v2/accounts/:account_id/sells"
    ),
    /**
     * Show an individual sell.
     */
    showSell: createMethodWithArgs<Sell, ShowSellArguments>(
      this,
      "GET",
      "/v2/accounts/:account_id/sells/:sell_id"
    ),
    /**
     * Sells a user-defined amount of crypto.
     *
     * There are two ways to define sell amounts–you can use either the `amount` or the `total` parameter:
     *
     * 1. When supplying `amount`, you’ll get the amount of bitcoin, bitcoin cash, litecoin or ethereum defined.
     * With `amount` it’s recommended to use BTC or ETH as the currency value, but you can always specify a
     * fiat currency and the amount will be converted to BTC or ETH respectively.
     *
     * 2. When supplying `total`, your payment method will be credited the total amount and you’ll get the amount
     * in BTC or ETH after fees have been reduced from the subtotal. With `total` it’s recommended to use the
     * currency of the payment method as the currency parameter, but you can always specify a different
     * currency and it will be converted.
     *
     * Given the price of digital currency depends on the time of the call and amount of the sell, it’s recommended
     * to use the `commit: false` parameter to create an uncommitted sell to get a quote and then to commit
     * that with a [separate request](https://developers.coinbase.com/api/v2#commit-a-sell).
     *
     * If you need to query the sell price without locking in the sell, you can use `quote: true` option. This
     * returns an unsaved sell and unlike `commit: false`, this sell can’t be completed. This option is useful
     * when you need to show the detailed sell price quote for the user when they are filling a form or similar
     * situation.
     */
    placeSellOrder: createMethodWithArgs<Sell, PlaceOrderArguments>(
      this,
      "POST",
      "/v2/accounts/:account_id/sells"
    ),

    /**
     * Lists buys for an account.
     */
    listBuys: createMethodWithArgs<PaginatedResult<Buy>, ListBuysArguments>(
      this,
      "GET",
      "/v2/accounts/:account_id/buys"
    ),
    /**
     * Show an individual buy.
     */
    showBuy: createMethodWithArgs<Sell, ShowBuyArguments>(
      this,
      "GET",
      "/v2/accounts/:account_id/buys/:buy_id"
    ),
    /**
     * Buys a user-defined amount of digital currency.
     *
     * There are two ways to define buy amounts–you can use either the `amount` or the `total` parameter:
     *
     * 1. When supplying `amount`, you’ll get the amount of bitcoin, bitcoin cash, litecoin or ethereum defined.
     * With `amount` it’s recommended to use BTC or ETH as the currency value, but you can always specify a
     * fiat currency and the amount will be converted to BTC or ETH respectively.
     *
     * 2. When supplying `total`, your payment method will be credited the total amount and you’ll get the amount
     * in BTC or ETH after fees have been reduced from the subtotal. With `total` it’s recommended to use the
     * currency of the payment method as the currency parameter, but you can always specify a different
     * currency and it will be converted.
     *
     * Given the price of digital currency depends on the time of the call and amount of the buy, it’s recommended
     * to use the `commit: false` parameter to create an uncommitted buy to get a quote and then to commit
     * that with a [separate request](https://developers.coinbase.com/api/v2#commit-a-buy).
     *
     * If you need to query the buy price without locking in the buy, you can use `quote: true` option. This
     * returns an unsaved buy and unlike `commit: false`, this buy can’t be completed. This option is useful
     * when you need to show the detailed buy price quote for the user when they are filling a form or similar
     * situation.
     */
    placeBuyOrder: createMethodWithArgs<Buy, PlaceOrderArguments>(
      this,
      "POST",
      "/v2/accounts/:account_id/buys"
    ),
  };

  public readonly data = {
    /**
     * List known currencies. Currency codes will conform to the ISO 4217 standard where possible.
     * Currencies which have or had no representation in ISO 4217 may use a custom code (e.g. `BTC`).
     *
     * __This endpoint doesn’t require authentication.__
     */
    getCurrencies: createMethod<Currency[]>(
      this,
      "GET",
      "/v2/currencies",
      false
    ),

    /**
     * Get current exchange rates. Default base currency is `USD` but it can be defined as any supported currency.
     * Returned rates will define the exchange rate for one unit of the base currency.
     *
     * __This endpoint doesn’t require authentication.__
     */
    getExchangeRates: createMethodWithOptionalArgs<
      GetExchangeRatesResult,
      GetExchangeRatesArguments
    >(this, "GET", "/v2/exchange-rates", false),

    /**
     * Get the API server time.
     *
     * __This endpoint doesn’t require authentication.__
     */
    getTime: createMethod<Time>(this, "GET", "/v2/time", false),

    /**
     * Get the total price to buy one unit of currency.
     *
     * __This endpoint doesn’t require authentication.__
     */
    getBuyPrice: createMethodWithArgs<PriceResult, GetPriceArguments>(
      this,
      "GET",
      "/v2/prices/:currency_pair/buy",
      false
    ),
    /**
     * Get the total price to sell one unit of currency.
     *
     * __This endpoint doesn’t require authentication.__
     */
    getSellPrice: createMethodWithArgs<PriceResult, GetPriceArguments>(
      this,
      "GET",
      "/v2/prices/:currency_pair/sell",
      false
    ),
    /**
     * Get the current market price for one unit of currency. This is usually somewhere in between the buy and sell price.
     * You can also get historic prices with date parameter.
     *
     * __This endpoint doesn’t require authentication.__
     */
    getSpotPrice: createMethodWithArgs<PriceResult, GetSpotPriceArguments>(
      this,
      "GET",
      "/v2/prices/:currency_pair/spot",
      false
    ),
  };

  public getOAuthAccessToken = createMethodWithArgs<
    OAuthAccessTokenResult,
    OAuthAccessTokenArguments
  >(this, "POST", "/oauth/token", false);

  public async request<T extends JsonCollection>(
    parameters: CoinbaseRequestArguments,
    auth = true
  ): Promise<CoinbaseResultObject> {
    const { method } = parameters;
    let { args, path } = parameters;
    let body: JsonObject | undefined;

    if (args) {
      args = Object.assign({}, args);
      const pathParts = parameters.path.split("/");
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        if (part.startsWith(":")) {
          const argName = part.slice(1);
          if (argName in args) {
            if (argName === undefined) {
              throw new Error(
                `cannot have undefined for path argument: ${argName}`
              );
            }
            pathParts[i] = String(args[argName]);
            delete args[argName];
          } else {
            throw new Error(`missing path argument: ${argName}`);
          }
        }
      }

      path = pathParts.join("/");

      const argLength = Object.keys(args).length;
      if (argLength > 0) {
        if (method === "GET") {
          // use leftover args to build a query string
          const query = Object.entries(args).reduce(
            (previous, current, index) => {
              if (current[1] !== undefined) {
                let next = previous + `${current[0]}=${current[1]}`;
                if (index < argLength - 1) {
                  next += "&";
                }
                return next;
              }
              return previous;
            },
            "?"
          );
          path += query;
        } else if (method === "POST") {
          // use leftover args as body
          body = args;
        }
      }
    }

    const newParameters = { method, path, args: body };

    const response = await (auth
      ? this.authedRequest(newParameters)
      : this.coinbaseRequest(newParameters));

    if (response.data) {
      const dataAsT = response.data as T;
      const { pagination } = response;
      if (pagination && Array.isArray(dataAsT)) {
        return new PaginatedResult(dataAsT as JsonObject[], pagination, this);
      }
      return dataAsT;
    }

    return response;
  }

  private async authedRequest(
    parameters: CoinbaseRequestArguments
  ): Promise<CoinbaseSuccessResponse> {
    if (!this.options) {
      throw new Error("Missing authentication");
    }

    switch (this.options.authStrategy) {
      case "apikey":
        return this.apiKeyRequest(parameters, this.options.auth);
      case "oauth":
        return this.oauthRequest(parameters, this.options.auth);
      default:
        throw new Error("Unrecognized authStrategy");
    }
  }

  /**
   * Make a Coinbase request with API keys for authentication. Automatically signs requests.
   *
   * @param parameters
   * @param apiKeys
   * @returns
   */
  private async apiKeyRequest(
    parameters: CoinbaseRequestArguments,
    apiKeys: ApiKeyOptions["auth"]
  ): Promise<CoinbaseSuccessResponse> {
    const { method, path, args: body } = parameters;
    const timestamp = String((await this.data.getTime()).epoch);
    const serializedBody = body ? JSON.stringify(body) : "";
    const signatureData = `${timestamp}${method}${path}${serializedBody}`;
    const sha = createHmac("sha256", apiKeys.apiSecret)
      .update(signatureData)
      .digest("hex");
    return this.coinbaseRequest(parameters, {
      "CB-ACCESS-KEY": apiKeys.apiKey,
      "CB-ACCESS-SIGN": sha,
      "CB-ACCESS-TIMESTAMP": timestamp,
    });
  }

  /**
   * Make a Coinbase request with OAuth access token. Automatically refreshes
   * expired access token with refresh token.
   *
   * @param parameters
   * @param oauth
   * @returns
   */
  private async oauthRequest(
    parameters: CoinbaseRequestArguments,
    oauth: OAuthOptions["auth"]
  ): Promise<CoinbaseSuccessResponse> {
    try {
      const result = await this.coinbaseRequest(parameters, {
        Authorization: `Bearer ${oauth.accessToken}`,
      });
      return result;
    } catch (e) {
      if (e.status === 401) {
        const { refreshToken, clientId, clientSecret } = oauth;

        const tokens = await this.getOAuthAccessToken({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        });
        oauth.refreshToken = tokens.refresh_token;
        oauth.accessToken = tokens.access_token;

        if (oauth.refreshCallback) {
          await oauth.refreshCallback(tokens);
        }

        return this.coinbaseRequest(parameters, {
          Authorization: `Bearer ${oauth.accessToken}`,
        });
      }

      throw e;
    }
  }

  private async coinbaseRequest(
    parameters: CoinbaseRequestArguments,
    headers: any = {}
  ): Promise<CoinbaseSuccessResponse> {
    const { path } = parameters;

    const result = await fetch(`${API_URL}${path}`, {
      method: parameters.method,
      body: parameters.args ? JSON.stringify(parameters.args) : undefined,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    const json = await result.json();

    if (result.ok) {
      return json;
    }

    throw new RequestError(result.status, json.errors);
  }
}