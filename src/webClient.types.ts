export type JsonValue = string | number | boolean | null | undefined;
export type JsonObject = { [key: string]: JsonValue | JsonObject | JsonArray };
export type JsonCollection = JsonObject | JsonArray;
export type JsonArray = (JsonObject | JsonValue)[];
export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
