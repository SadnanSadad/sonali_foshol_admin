import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, logout, twoFactorChallenge, type LoginResult } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

export function useLoginMutation() {
  const setUser = useAuthStore((state) => state.setUser)
  const queryClient = useQueryClient()
  return useMutation<LoginResult, Error, { login: string; password: string; remember?: boolean }>({
    mutationFn: login,
    onSuccess: (result) => {
      if (result.kind === 'authenticated') {
        setUser(result.user)
        void queryClient.invalidateQueries()
      }
    },
  })
}

export function useTwoFactorChallenge() {
  const setUser = useAuthStore((state) => state.setUser)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: twoFactorChallenge,
    onSuccess: (user) => {
      setUser(user)
      void queryClient.invalidateQueries()
    },
  })
}

export function useLogoutMutation() {
  const clear = useAuthStore((state) => state.clear)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => {
      clear()
      queryClient.clear()
    },
  })
}
