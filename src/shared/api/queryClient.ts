import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, resetCsrf } from "./client";
import { useUiStore } from "@/shared/stores/uiStore";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ApiError && error.status === 401) {
        resetCsrf();
        queryClient.setQueryData(["auth", "me"], null);
        queryClient.removeQueries({
          predicate: (query) => query.queryKey[0] !== "auth",
        });
        useUiStore.getState().reset();
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 5 * 60000,
      retry: (count, error) =>
        count < 1 && (!(error instanceof ApiError) || error.status >= 500),
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
      onError: (error) => {
        if (error instanceof ApiError && error.status === 401) {
          resetCsrf();
          queryClient.clear();
          queryClient.setQueryData(["auth", "me"], null);
          useUiStore.getState().reset();
        }
      },
    },
  },
});
