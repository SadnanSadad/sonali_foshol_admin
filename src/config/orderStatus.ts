import {
  Ban,
  CheckCircle2,
  Clock,
  PackageCheck,
  Truck,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { OrderStatus } from '@/types'

export interface OrderStatusConfig {
  label: string
  labelBn: string
  color: string
  bg: string
  icon: LucideIcon
  step: number
}

export const ORDER_STATUS_ORDER: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
]

export const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'rejected',
  'cancelled',
]

export const ORDER_STATUS_CONFIG: Record<OrderStatus, OrderStatusConfig> = {
  pending: {
    label: 'Pending',
    labelBn: 'অপেক্ষমাণ',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: Clock,
    step: 0,
  },
  confirmed: {
    label: 'Confirmed',
    labelBn: 'নিশ্চিত',
    color: '#2563EB',
    bg: '#DBEAFE',
    icon: CheckCircle2,
    step: 1,
  },
  processing: {
    label: 'Processing',
    labelBn: 'প্রক্রিয়াধীন',
    color: '#4F46E5',
    bg: '#E0E7FF',
    icon: PackageCheck,
    step: 2,
  },
  shipped: {
    label: 'Shipped',
    labelBn: 'পাঠানো হয়েছে',
    color: '#7C3AED',
    bg: '#EDE9FE',
    icon: Truck,
    step: 3,
  },
  delivered: {
    label: 'Delivered',
    labelBn: 'ডেলিভারি সম্পন্ন',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: CheckCircle2,
    step: 4,
  },
  rejected: {
    label: 'Rejected',
    labelBn: 'বাতিল',
    color: '#DC2626',
    bg: '#FEE2E2',
    icon: XCircle,
    step: -1,
  },
  cancelled: {
    label: 'Cancelled',
    labelBn: 'বাতিল হয়েছে',
    color: '#5A6560',
    bg: '#F1EAE0',
    icon: Ban,
    step: -1,
  },
}

export const REJECTION_REASONS = [
  { value: 'out_of_stock', label: 'Out of stock', labelBn: 'স্টকে নেই' },
  { value: 'unreachable', label: 'Unreachable customer', labelBn: 'গ্রাহকের সাথে যোগাযোগ সম্ভব হয়নি' },
  { value: 'invalid_address', label: 'Invalid address', labelBn: 'ভুল ঠিকানা' },
  { value: 'fake_order', label: 'Suspected fake order', labelBn: 'সন্দেহজনক অর্ডার' },
  { value: 'outside_area', label: 'Outside delivery area', labelBn: 'ডেলিভারি এলাকার বাইরে' },
  { value: 'other', label: 'Other', labelBn: 'অন্যান্য' },
] as const

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'rejected', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: [],
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from] ?? []
}

export function rejectionReasonLabel(value: string): string {
  return REJECTION_REASONS.find((reason) => reason.value === value)?.label ?? value
}

export function rejectionReasonLabelBn(value: string): string {
  return REJECTION_REASONS.find((reason) => reason.value === value)?.labelBn ?? value
}
