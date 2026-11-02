import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { api, jsonBody } from "@/shared/api/client";
import { useUiStore } from "@/shared/stores/uiStore";

export function useAction<T = unknown, R = { id: string }>(
  path: string | ((value: T) => string),
  invalidate: QueryKey[],
  method = "POST",
  message = "Changes saved.",
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (value: T) =>
      api<R>(typeof path === "function" ? path(value) : path, {
        method,
        body: value instanceof FormData ? value : jsonBody(value),
      }),
    onSuccess: async () => {
      await Promise.all(
        invalidate.map((queryKey) => client.invalidateQueries({ queryKey })),
      );
      if (message) useUiStore.getState().notify(message);
    },
  });
}
