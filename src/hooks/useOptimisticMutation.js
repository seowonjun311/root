import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Standardized mutation hook with optimistic UI updates
 * Handles cancel, setQueryData, error recovery pattern across the app
 * 
 * @param {string} queryKey - Query key to update
 * @param {function} mutationFn - Async mutation function
 * @param {function} updateFn - Function to compute optimistic data: (prev, payload) => newData
 * @param {function} getRollback - Function to compute rollback data: (prev, payload) => newData
 * @param {function} onSuccess - Optional success callback
 * @param {function} onError - Optional error callback
 */
export function useOptimisticMutation({
  queryKey,
  mutationFn,
  updateFn,
  getRollback = (prev) => prev,
  onSuccess,
  onError,
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (payload) => {
      // Cancel ongoing queries
      await queryClient.cancelQueries({ queryKey });

      // Capture previous data
      const previousData = queryClient.getQueryData(queryKey);

      // Update UI optimistically
      const optimisticData = updateFn(previousData, payload);
      queryClient.setQueryData(queryKey, optimisticData);

      return { previousData };
    },
    onError: (error, payload, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, getRollback(context.previousData, payload));
      }
      onError?.(error);
    },
    onSuccess: (response, payload, context) => {
      onSuccess?.(response);
    },
    onSettled: () => {
      // Revalidate after mutation
      queryClient.invalidateQueries({ queryKey });
    },
  });
}