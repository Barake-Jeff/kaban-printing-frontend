import type { ComputedRef, MaybeRef } from 'vue'

type ComponentProps<T> = T extends new(...args: any) => { $props: infer P } ? NonNullable<P>
  : T extends (props: infer P, ...args: any) => any ? P
  : {}

declare module 'nuxt/app' {
  interface NuxtLayouts {
    admin: ComponentProps<typeof import("C:/Users/Barake/Desktop/repos/kaban-printing-frontend/layouts/admin.vue").default>,
    customer: ComponentProps<typeof import("C:/Users/Barake/Desktop/repos/kaban-printing-frontend/layouts/customer.vue").default>,
    default: ComponentProps<typeof import("C:/Users/Barake/Desktop/repos/kaban-printing-frontend/layouts/default.vue").default>,
}
  export type LayoutKey = keyof NuxtLayouts extends never ? string : keyof NuxtLayouts
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false>
  }
}