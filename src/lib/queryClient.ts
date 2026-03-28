import { QueryClient } from "@tanstack/react-query";
import { useUiStore } from "@/stores/ui-store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        useUiStore.getState().addToast({
          title: "Something went wrong",
          description:
            error instanceof Error ? error.message : "An unexpected error occurred",
          variant: "destructive",
        });
      },
    },
  },
});
