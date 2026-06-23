export type ColorMode = 'bw' | 'color'
export type SideMode = 'single' | 'double'
export type PaperSize = 'A4' | 'A5' | 'Letter' | 'Legal'
export type DeliveryType = 'pickup' | 'delivery'
export type PaymentMethod = 'mpesa' | 'pay_on_pickup'
export type PaymentStatus = 'paid' | 'unpaid' | 'pay_on_pickup'
export type JobStatus = 'pending' | 'printing' | 'ready' | 'delivered'
export type UserRole = 'customer' | 'admin'
export type AlertType = 'unpaid' | 'wait' | 'delivery'

export interface User {
  id: string
  name: string
  phone: string
  houseNumber?: string
  estate?: string
  role?: UserRole
}

export interface Job {
  id: string
  userId: string
  fileName: string | null
  fileType: string | null
  instructions: string | null
  pages: number
  copies: number
  colorMode: ColorMode
  sides: SideMode
  paperSize: PaperSize
  deliveryType: DeliveryType
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  mpesaRef: string | null
  status: JobStatus
  cost: number
  deliveryFee: number
  createdAt: string
  updatedAt: string
  notifySms: boolean
  notifyWhatsapp: boolean
  adminNotes: string
  total?: number
  // Admin-enriched display fields (present only in the admin queue)
  customerName?: string
  houseNumber?: string
  phone?: string
}

export interface AdminStats {
  jobsToday: number
  pending: number
  completed: number
  revenueToday: number
}

export interface Alert {
  id: number
  type: AlertType
  message: string
  jobId: string
}

export interface Customer {
  id: string
  name: string
  houseNumber: string
  phone: string
  totalJobs: number
  totalSpent: number
  payOnPickupCount: number
  mpesaCount: number
}

export interface Pricing {
  bwPerPage: number
  colorPerPage: number
  doubleSidedMultiplier: number
  deliveryFee: number
}

export interface CostParams {
  pages: number
  copies: number
  colorMode: ColorMode
  sides: SideMode
  deliveryType: DeliveryType
}

export interface CostResult {
  printCost: number
  deliveryFee: number
  total: number
}

export interface LoginPayload {
  phone: string
  password: string
}

export interface SignupPayload {
  name: string
  phone: string
  houseNumber: string
  estate: string
  password: string
  confirm?: string
}

export interface SubmitJobPayload {
  fileName: string | null
  instructions: string
  copies: number
  colorMode: ColorMode
  sides: SideMode
  paperSize: PaperSize
  deliveryType: DeliveryType
  pages: number
  paymentMethod?: PaymentMethod
}

// Augment vue-router RouteMeta with our custom page meta fields
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    role?: UserRole
  }
}
