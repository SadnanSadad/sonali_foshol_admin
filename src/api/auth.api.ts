import type { AdminUser } from '@/types'
import { axiosInstance, ensureCsrfCookie } from './axiosInstance'
import type { ApiEnvelope } from '@/types'

export type LoginResult =
  | { kind: 'authenticated'; user: AdminUser }
  | { kind: 'twoFactorRequired'; challengeToken: string }

export async function login(payload: {
  login: string
  password: string
  remember?: boolean
}): Promise<LoginResult> {
  await ensureCsrfCookie()
  const { data } = await axiosInstance.post<ApiEnvelope<unknown>>(
    '/api/auth/admin/login',
    payload,
  )
  const body = data.data as
    | { user: AdminUser }
    | { two_factor_required: true; challenge_token: string }
  if ('two_factor_required' in body) {
    return {
      kind: 'twoFactorRequired',
      challengeToken: body.challenge_token,
    }
  }
  return { kind: 'authenticated', user: body.user }
}

export async function twoFactorChallenge(payload: {
  challenge_token: string
  code: string
}): Promise<AdminUser> {
  const { data } = await axiosInstance.post<ApiEnvelope<AdminUser>>(
    '/api/auth/admin/2fa/challenge',
    payload,
  )
  return data.data
}

export async function fetchMe(): Promise<AdminUser> {
  const { data } = await axiosInstance.get<ApiEnvelope<AdminUser>>('/api/auth/admin/me')
  return data.data
}

export async function logout(): Promise<{ success: boolean }> {
  await ensureCsrfCookie()
  const { data } = await axiosInstance.post<ApiEnvelope<{ success: boolean }>>(
    '/api/auth/admin/logout',
  )
  return data.data
}

export async function updatePassword(payload: {
  current_password: string
  password: string
}): Promise<{ success: boolean }> {
  const { data } = await axiosInstance.put<ApiEnvelope<{ success: boolean }>>(
    '/api/auth/admin/password',
    payload,
  )
  return data.data
}

export async function forgotPassword(payload: { email: string }): Promise<{ success: boolean }> {
  const { data } = await axiosInstance.post<ApiEnvelope<{ success: boolean }>>(
    '/api/auth/admin/forgot-password',
    payload,
  )
  return data.data
}

export async function resetPassword(payload: {
  email: string
  token: string
  password: string
}): Promise<{ success: boolean }> {
  const { data } = await axiosInstance.post<ApiEnvelope<{ success: boolean }>>(
    '/api/auth/admin/reset-password',
    payload,
  )
  return data.data
}

export async function twoFactorEnable(): Promise<{
  secret: string
  qr_svg: string
  recovery_codes: string[]
}> {
  const { data } = await axiosInstance.post<ApiEnvelope<{
    secret: string
    qr_svg: string
    recovery_codes: string[]
  }>>('/api/auth/admin/2fa/enable')
  return data.data
}

export async function twoFactorConfirm(payload: { code: string }): Promise<AdminUser> {
  const { data } = await axiosInstance.post<ApiEnvelope<AdminUser>>(
    '/api/auth/admin/2fa/confirm',
    payload,
  )
  return data.data
}

export async function twoFactorDisable(payload: {
  password: string
  code: string
}): Promise<{ success: boolean }> {
  const { data } = await axiosInstance.post<ApiEnvelope<{ success: boolean }>>(
    '/api/auth/admin/2fa/disable',
    payload,
  )
  return data.data
}

export async function twoFactorRecoveryCodes(payload: {
  password: string
}): Promise<{ recovery_codes: string[] }> {
  const { data } = await axiosInstance.post<ApiEnvelope<{ recovery_codes: string[] }>>(
    '/api/auth/admin/2fa/recovery-codes',
    payload,
  )
  return data.data
}
