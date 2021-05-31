import { PaginatedResult } from "./results";
import { JsonCollection, JsonObject, RequestMethod } from "./webClient.types";

//////////////
// Client
//////////////

export interface CoinbaseError extends JsonObject {
  id: string;
  message: string;
  url?: string;
}

export interface CoinbasePagination extends JsonObject {
  ending_before: string | null;
  starting_after: string | null;
  limit: number;
  order: ListOrder;
  previous_uri: string | null;
  next_uri: string | null;
}

export interface CoinbaseSuccessResponse extends JsonObject {
  pagination?: CoinbasePagination;
  data: JsonCollection;
}

export interface CoinbaseErrorResponse extends JsonObject {
  errors: CoinbaseError[];
}

export type CoinbaseResponse = CoinbaseSuccessResponse | CoinbaseErrorResponse;

export interface ApiKeyOptions {
  authStrategy: "apikey";
  auth: {
    apiKey: string;
    apiSecret: string;
  };
}

export interface OAuthOptions {
  authStrategy: "oauth";
  auth: {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
    refreshToken: string;
    refreshCallback?: (tokens: OAuthAccessTokenResult) => void | Promise<void>
  };
}

export type CoinbaseOptions = ApiKeyOptions | OAuthOptions;

export interface CoinbaseRequestArguments {
  method: RequestMethod;
  path: string;
  args?: JsonObject;
}

export type CoinbaseResultObject = JsonCollection | PaginatedResult<JsonObject>;

//////////////
// Auth
//////////////

interface BaseOAuthAccessTokenArguments extends JsonObject {
  client_id: string;
  client_secret: string;
}

interface OAuthAccessTokenRefreshTokenArguments
  extends BaseOAuthAccessTokenArguments {
  grant_type: "refresh_token";
  refresh_token: string;
}

interface OAuthAccessTokenAuthCodeArguments
  extends BaseOAuthAccessTokenArguments {
  grant_type: "authorization_code";
  code: string;
  redirect_uri: string;
}

export type OAuthAccessTokenArguments =
  | OAuthAccessTokenRefreshTokenArguments
  | OAuthAccessTokenAuthCodeArguments;

export interface OAuthAccessTokenResult extends JsonObject {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

//////////////
// Shared
//////////////

export type ListOrder = "asc" | "desc";

export const enum CurrencyCode {
  BTC = "BTC",
  ETH = "ETH",
  USD = "USD",
}

export interface MoneyHash extends JsonObject {
  amount: string;
  currency: CurrencyCode;
}

export interface Resource extends JsonObject {
  id: string;
  resource: string;
  resource_path: string;
}

export interface ResourceHash<T extends Resource> extends Resource {
  resource: T["resource"];
}

export interface DetailsHash extends JsonObject {
  title: string;
  subtitle: string;
  header: string;
  health: string;
  payment_method_name: string;
}

export interface PaginationArguments extends JsonObject {
  /**
   * Number of results per call. Accepted values: 0 - 100. Default 25
   */
  limit?: number;
  /**
   * Result order. Accepted values: `desc` (default), `asc`
   */
  order?: ListOrder;
  /**
   * A cursor for use in pagination. `starting_after` is a resource ID that defines your place in the list.
   */
  starting_after?: string;
  /**
   * A cursor for use in pagination. `ending_before` is an resource ID that defines your place in the list.
   */
  ending_before?: string;
}

/**
 * Arguments for requests that require and associated account Id.
 */
export interface AccountIdArguments extends JsonObject {
  account_id: string;
}

//////////////
// Users
//////////////

export interface User extends JsonObject {
  id: string;
  name?: string;
  username?: string;
  profile_location?: string;
  profile_bio?: string;
  profile_url?: string;
  avatar_url: string;
}

export interface WithEmail {
  email: string;
}

//////////////
// Accounts
//////////////

export interface Account extends JsonObject {
  id: string;
  name: string;
  primary: boolean;
  type: "wallet" | "fiat" | "vault";
  currency: string;
  balance: MoneyHash;
  created_at: string;
  updated_at: string;
  resource: "account";
  resource_path: string;
}

export interface UpdateAccountArguments extends AccountIdArguments {
  /**
   * Account name
   */
  name: string;
}

//////////////
// Transactions
//////////////

export const enum TransactionType {
  /**
   * Sent crypto to another crypto address or email
   */
  Send = "send",
  /**
   * Requested crypto from a user or email
   */
  Request = "request",
  /**
   * Transfered funds between two of a user’s accounts
   */
  Transfer = "transfer",
  /**
   * Bought crypto
   */
  Buy = "buy",
  /**
   * Sold crypto
   */
  Sell = "sell",
  /**
   * Deposited funds into a fiat account from a financial institution
   */
  FiatDeposit = "fiat_deposit",
  /**
   * Withdrew funds from a fiat account
   */
  FiatWithdrawal = "fiat_withdrawal",
  /**
   * Deposited money into [Coinbase Pro](https://pro.coinbase.com/)
   */
  ExchangeDeposit = "exchange_deposit",
  /**
   * Withdrew money from [Coinbase Pro](https://pro.coinbase.com/)
   */
  ExchangeWithdrawal = "exchange_withdrawal",
  /**
   * Withdrew funds from a vault account
   */
  VaultWithdrawal = "vault_withdrawal",
}

export const enum TransactionStatus {
  Created = "created",
  /**
   * Pending transactions (e.g. a send or a buy)
   */
  Pending = "pending",
  /**
   * Completed transactions (e.g. a send or a buy)
   */
  Completed = "completed",
  /**
   * Failed transactions (e.g. failed buy)
   */
  Failed = "failed",
  /**
   * Conditional transaction expired due to external factors
   */
  Expired = "expired",
  /**
   * Transaction was canceled
   */
  Canceled = "canceled",
  /**
   * Vault withdrawal is waiting for approval
   */
  WaitingForSignature = "waiting_for_signature",
  /**
   * Vault withdrawal is waiting to be cleared
   */
  WaitingForClearing = "waiting_for_clearing",
}

interface BaseTransaction extends Resource {
  type: TransactionType;
  status: TransactionStatus;
  amount: MoneyHash;
  /**
   * Amount without fees
   */
  subtotal: MoneyHash;
  fee: MoneyHash;
  /**
   * Amount in user’s native currency
   */
  native_amount: MoneyHash;
  /**
   * User defined description
   */
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction extends BaseTransaction {
  resource: "transaction";
  /**
   * Detailed information about the transaction
   */
  details: DetailsHash;
  /**
   * Information about crypto network including network transaction hash if transaction was on-blockchain.
   */
  network?: string;
  /**
   * The receiving party of a debit transaction. Usually another resource but can also be another type like email.
   */
  to?: string;
  /**
   * The originating party of a credit transaction. Usually another resource but can also be another type like bitcoin network.
   */
  from?: string;
  /**
   * Associated crypto address for received payment.
   */
  address?: string;
  /**
   * Associated OAuth2 application
   */
  application?: string;
}

interface AddressableChildTransaction<
  Type extends TransactionType,
  Resource extends string
> extends BaseTransaction {
  type: Type;
  status:
    | TransactionStatus.Created
    | TransactionStatus.Completed
    | TransactionStatus.Canceled;
  resource: Resource;
  /**
   * Whether or not the transaction has been committed
   */
  committed: boolean;
  /**
   * Whether or not the transaction was executed instantly
   */
  instant: boolean;
  /**
   * When a transaction isn’t executed instantly, it will receive a payout date for the time it will be executed
   */
  payout_at: string;
}

export interface ListTransactionArguments
  extends AccountIdArguments,
    PaginationArguments {}

export interface ShowTransactionArguments extends AccountIdArguments {
  transaction_id: string;
}

//////////////
// Buys
//////////////

export interface BuySell<
  T extends TransactionType.Buy | TransactionType.Sell,
  R extends "buy" | "sell"
> extends AddressableChildTransaction<T, R> {
  /**
   * Fiat amount with fees
   */
  total: MoneyHash;
}

export type Buy = BuySell<TransactionType.Buy, "buy">;

export interface ShowBuyArguments extends AccountIdArguments {
  buy_id: string;
}

export interface ListBuysArguments
  extends AccountIdArguments,
    PaginationArguments {}

//////////////
// Sells
//////////////

type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
type XOR<T, U> = T | U extends any
  ? (Without<T, U> & U) | (Without<U, T> & T)
  : T | U;

export type Sell = BuySell<TransactionType.Sell, "sell">;

export interface ShowSellArguments extends AccountIdArguments {
  sell_id: string;
}

export type ListSellsArguments = AccountIdArguments & PaginationArguments;

export interface BasePlaceOrderArguments extends AccountIdArguments {
  /**
   * Currency for the amount
   */
  currency: string;
  /**
   * The ID of the payment method that should be used for the order. Payment methods can be listed using the GET /payment-methods API call.
   */
  payment_method?: string;
  /**
   * Whether or not you would still like to place the order if you have to wait for your money to arrive to lock in a price
   */
  agree_btc_amount_varies?: boolean;
  /**
   * If set to `false`, this buy will not be immediately completed. Use the commit call to complete it. Default value: `true`
   */
  commit?: boolean;
  /**
   * If set to `true`, response will return an unsaved sell for detailed price quote. Default value: `false`
   */
  quote?: boolean;
}

export type PlaceOrderArguments = XOR<
  BasePlaceOrderArguments & {
    /**
     * Order amount. Specify `total` instead to specify amount with fees.
     */
    amount: string;
  },
  BasePlaceOrderArguments & {
    /**
     * Order amount with fees. Specify `amount` instead to specify amount without fees.
     */
    total: string;
  }
>;
//////////////
// Payment methods
//////////////

// TODO: fill out
interface PaymentMethod extends Resource {
  resource: "payment_method";
}

//////////////
// Data
//////////////

export interface GetExchangeRatesArguments extends JsonObject {
  /**
   * Base currency (default: `USD`)
   */
  currency?: CurrencyCode;
}

export interface GetExchangeRatesResult extends GetExchangeRatesArguments {
  rates: {
    [currencyCode: string]: string;
  };
}

export interface PriceResult extends MoneyHash {
  base: CurrencyCode;
}

export interface Currency extends JsonObject {
  id: string;
  name: string;
  min_size: string;
}

export interface GetPriceArguments extends JsonObject {
  /**
   * e.g. BTC-USD
   */
  currency_pair: string;
}

export interface GetSpotPriceArguments extends GetPriceArguments {
  /**
   * Specify date for historic spot price in format `YYYY-MM-DD` (UTC)
   */
  date?: string;
}

export interface Time extends JsonObject {
  iso: string;
  epoch: number;
}
