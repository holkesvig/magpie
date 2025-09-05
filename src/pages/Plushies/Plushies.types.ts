export type PlushieRecord = {
    id?: string;
    dateKey: string;     // 'YYYY-MM-DD' (local)
    count: number;
    notes?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  
  export type PlushiesListResponse = { records: PlushieRecord[] };
  
  export type DayCell = {
    dateKey: string;
    raw: number;         // raw count from Airtable
    effective: number;   // raw + bank used to cover shortfall
    complete: boolean;   // met the daily goal (via raw and/or bank)
    bankAfter: number;   // bank after this day
  };
  
  export type Metrics = {
    goalPerDay: number;
    total: number;
    bank: number;
    aheadDrops: number;
    aheadDays: number;
    daysCompleted: number;
    daysTo3000: number;
    daysTo3500: number;
    pct3000: number;          // 0..1
    eta3000?: string;         // ISO date
    eta3500?: string;
    days: DayCell[];          // for heatmap, charts, etc.
  };
  