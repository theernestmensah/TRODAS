/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as activity from "../activity.js";
import type * as audit from "../audit.js";
import type * as clients from "../clients.js";
import type * as feedback from "../feedback.js";
import type * as invites from "../invites.js";
import type * as projects from "../projects.js";
import type * as resources from "../resources.js";
import type * as samples from "../samples.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  access: typeof access;
  activity: typeof activity;
  audit: typeof audit;
  clients: typeof clients;
  feedback: typeof feedback;
  invites: typeof invites;
  projects: typeof projects;
  resources: typeof resources;
  samples: typeof samples;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
