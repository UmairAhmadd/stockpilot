import type { SVGProps } from 'react'

export type IconName =
  | 'box' | 'dollar' | 'trendDown' | 'inventory' | 'cart' | 'users'
  | 'trendUp' | 'alert' | 'grid' | 'layers' | 'list' | 'report'
  | 'account' | 'arrowUpRight' | 'search' | 'bell' | 'menu' | 'truck'
  | 'camera' | 'mail' | 'phone'

const paths: Record<IconName, JSX.Element> = {
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" /><path d="m3 8 9 5 9-5" /><path d="M12 13v8" /></>,
  dollar: <><path d="M12 2v20" /><path d="M17 6.5C17 4.6 14.8 4 12 4S7 4.6 7 6.5 9.2 9 12 9s5 .9 5 2.8-2.2 2.7-5 2.7-5-.8-5-2.7" /></>,
  trendDown: <><path d="M3 7l6 6 4-4 8 8" /><path d="M21 17v-4h-4" /></>,
  inventory: <><rect x="3" y="4" width="18" height="4" rx="1" /><path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" /><path d="M10 12h4" /></>,
  cart: <><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h2l2.4 12.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L21 7H6" /></>,
  users: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 4.2a3.2 3.2 0 0 1 0 6.1" /><path d="M21 20c0-2.6-1.5-4.6-3.8-5.2" /></>,
  trendUp: <><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7v4h-4" /></>,
  alert: <><path d="M12 3 2.5 20h19L12 3Z" /><path d="M12 9v5" /><path d="M12 17.5h.01" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.4" /><rect x="14" y="3" width="7" height="7" rx="1.4" /><rect x="3" y="14" width="7" height="7" rx="1.4" /><rect x="14" y="14" width="7" height="7" rx="1.4" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
  report: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 7h6M9 11h6M9 15h4" /></>,
  account: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></>,
  arrowUpRight: <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.2-3.2" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10.5 19a1.5 1.5 0 0 0 3 0" /></>,
  menu: <><path d="M3 6h18M3 12h18M3 18h18" /></>,
  truck:  <><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" /><rect x="9" y="11" width="14" height="10" rx="2" /><circle cx="12" cy="21" r="1" /><circle cx="20" cy="21" r="1" /></>,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  mail:   <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" /></>,
  phone:  <><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 3.1 4.2 2 2 0 0 1 5 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L9 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7A2 2 0 0 1 22 16.9Z" /></>,
}

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

export default function Icon({ name, size = 20, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths[name]}
    </svg>
  )
}
