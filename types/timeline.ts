// TypeScript types for CV Timeline System

export interface TimelineItem {
  id: string
  type: 'education' | 'internship' | 'military' | 'work' | 'gap' | 'current_work'
  title: string
  organization: string
  location: string
  start_date: string // ISO date string
  end_date: string | null // null if current
  is_current: boolean
  description: string
  skills: string[]
  achievements: string[]
  color: string // hex color
  display_order: number
}

export interface CVProfile {
  id: number
  user_id: string
  full_name: string
  title: string
  description: string
  lat: number
  lon: number
  country: string
  city: string
  contact: string
  skills: string[]
  experience_years: number
  remote_available: boolean
  salary_expectation_min: number | null
  salary_expectation_max: number | null
  currency: string
  available_for_work: boolean
  timeline_data: TimelineItem[]
  is_timeline_public: boolean
  profile_photo_url: string | null
  linkedin_url: string | null
  github_url: string | null
  created_at: string
}

export interface TimelineColorConfig {
  education: string
  internship: string
  military: string
  work: string
  gap: string
  current_work: string
}

export interface TimelineDisplayOptions {
  showSkills: boolean
  showAchievements: boolean
  showDescriptions: boolean
  groupSimilarPeriods: boolean
  timelineOrientation: 'horizontal' | 'vertical'
  zoomLevel: number
}

export interface CVMarkerData {
  id: string
  type: 'cv'
  title: string
  name: string
  company: string
  location: {
    lat: number
    lng: number
  }
  address: string
  contact: string
  skills: string[]
  experience_years: number
  remote_available: boolean
  salary_min: number | null
  salary_max: number | null
  currency: string
  timeline_items_count: number
  latest_position: string
  profile_photo_url: string | null
  source: 'manual'
  postedDate: string
}

export interface LayerState {
  jobs: {
    visible: boolean
    count: number
    filters: JobFilters
  }
  cvs: {
    visible: boolean
    count: number
    filters: CVFilters
  }
}

export interface JobFilters {
  search: string
  country: string
  city: string
  remote: 'all' | 'true' | 'false'
  salary_min: number | null
  salary_max: number | null
  source: string[]
}

export interface CVFilters {
  search: string
  country: string
  city: string
  remote: 'all' | 'true' | 'false'
  skills: string[]
  experience_min: number | null
  experience_max: number | null
  education_level: string[]
  timeline_types: string[]
}

export interface TimelineModalProps {
  isOpen: boolean
  cvProfile: CVProfile | null
  onClose: () => void
  displayOptions?: Partial<TimelineDisplayOptions>
}

export interface CVMarkerProps {
  cvData: CVMarkerData
  onTimelineClick: (cvId: string) => void
  isClusterMode: boolean
}

// Vis-timeline specific types
export interface VisTimelineItem {
  id: string
  content: string
  start: Date
  end?: Date
  group?: string
  className?: string
  style?: string
  title?: string
  type?: 'point' | 'box' | 'range' | 'background'
}

export interface VisTimelineGroup {
  id: string
  content: string
  value?: number
  className?: string
  style?: string
  order?: number
  treeLevel?: number
  nestedGroups?: string[]
}

export interface VisTimelineOptions {
  width?: string | number
  height?: string | number
  margin?: {
    axis?: number
    item?: {
      horizontal?: number
      vertical?: number
    }
  }
  orientation?: 'both' | 'bottom' | 'top'
  align?: 'auto' | 'center' | 'left' | 'right'
  stack?: boolean
  stackSubgroups?: boolean
  showCurrentTime?: boolean
  showMajorLabels?: boolean
  showMinorLabels?: boolean
  zoomable?: boolean
  moveable?: boolean
  selectable?: boolean
  multiselect?: boolean
  editable?: boolean | {
    add?: boolean
    updateTime?: boolean
    updateGroup?: boolean
    remove?: boolean
    overrideItems?: boolean
  }
  groupOrder?: string | Function
  groupOrderSwap?: Function
  tooltip?: {
    followMouse?: boolean
    overflowMethod?: 'cap' | 'flip' | 'none'
    delay?: number
  }
  format?: {
    minorLabels?: any
    majorLabels?: any
  }
  timeAxis?: {
    scale?: string
    step?: number
  }
  locale?: string
  moment?: any
}

// API Response types
export interface GetCVDataResponse {
  success: boolean
  data: CVProfile[]
  stats: {
    total_items: number
    current_page: number
    total_pages: number
    items_per_page: number
    has_next_page: boolean
    has_prev_page: boolean
  }
  filters: CVFilters
}

export interface TimelineAnalytics {
  id: number
  full_name: string
  city: string
  country: string
  timeline_items_count: number
  work_experiences_count: number
  latest_education_date: string | null
  unique_skills_count: number
}

// Error types
export interface TimelineError {
  code: string
  message: string
  details?: any
}

// Event types for timeline interactions
export interface TimelineSelectEvent {
  items: string[]
  event: MouseEvent
}

export interface TimelineRangeChangeEvent {
  start: Date
  end: Date
  byUser: boolean
}

export interface TimelineClickEvent {
  item: string | null
  group: string | null
  time: Date
  event: MouseEvent
}