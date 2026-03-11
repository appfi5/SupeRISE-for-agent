import type { ApiResponse } from "@superise/app-contracts";
import { apiSuccess } from "@superise/app-contracts";

export function ok<T>(data: T): ApiResponse<T> {
  return apiSuccess(data);
}
