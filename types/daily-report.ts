export interface Activity {
  id: string
  reportId: string
  projectCategory: string
  content: string
  workingHours: number
  issues: string
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface DailyReport {
  id: string
  date: Date
  quarterlyGoal: string
  improvements: string
  happyMoments: string
  futureTasks: string
  createdAt: Date
  updatedAt: Date
  userId?: string | null
  activities: Activity[]
}

export interface CreateActivityInput {
  projectCategory: string
  content: string
  workingHours: number
  issues: string
  order: number
}

export interface CreateDailyReportInput {
  date: Date
  quarterlyGoal: string
  improvements: string
  happyMoments: string
  futureTasks: string
  activities: CreateActivityInput[]
  userId?: string
}

export interface UpdateDailyReportInput extends Partial<Omit<CreateDailyReportInput, 'activities'>> {
  id: string
  activities?: CreateActivityInput[]
}
