/** 外出喝咖啡体验记录 */
export interface OutingRecord {
  id: string
  date: string
  city: string
  shopName: string
  /** 咖啡豆/茶 */
  beansOrTea?: string
  price: number
  notes: string
}
