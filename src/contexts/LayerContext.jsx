import React, { createContext, useContext, useReducer, useEffect } from 'react'

// Layer management context for dual map system (Jobs + CVs)
const LayerContext = createContext()

// Initial layer state
const initialLayerState = {
  jobs: {
    visible: true,
    count: 0,
    loading: false,
    error: null,
    filters: {
      search: '',
      country: '',
      city: '',
      remote: 'all',
      salary_min: null,
      salary_max: null,
      source: []
    },
    data: []
  },
  cvs: {
    visible: true,
    count: 0,
    loading: false,
    error: null,
    filters: {
      search: '',
      country: '',
      city: '',
      remote: 'all',
      skills: [],
      experience_min: null,
      experience_max: null,
      education_level: [],
      timeline_types: []
    },
    data: []
  },
  activeModal: null, // 'timeline' | 'job-detail' | null
  selectedItem: null
}

// Layer action types
const LAYER_ACTIONS = {
  TOGGLE_LAYER: 'TOGGLE_LAYER',
  SET_LAYER_DATA: 'SET_LAYER_DATA',
  UPDATE_LAYER_FILTERS: 'UPDATE_LAYER_FILTERS',
  SET_LAYER_LOADING: 'SET_LAYER_LOADING',
  SET_LAYER_ERROR: 'SET_LAYER_ERROR',
  CLEAR_LAYER_FILTERS: 'CLEAR_LAYER_FILTERS',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  SELECT_ITEM: 'SELECT_ITEM'
}

// Layer reducer
function layerReducer(state, action) {
  switch (action.type) {
    case LAYER_ACTIONS.TOGGLE_LAYER:
      return {
        ...state,
        [action.layer]: {
          ...state[action.layer],
          visible: !state[action.layer].visible
        }
      }

    case LAYER_ACTIONS.SET_LAYER_DATA:
      return {
        ...state,
        [action.layer]: {
          ...state[action.layer],
          data: action.data,
          count: action.data.length,
          loading: false,
          error: null
        }
      }

    case LAYER_ACTIONS.UPDATE_LAYER_FILTERS:
      return {
        ...state,
        [action.layer]: {
          ...state[action.layer],
          filters: {
            ...state[action.layer].filters,
            ...action.filters
          }
        }
      }

    case LAYER_ACTIONS.SET_LAYER_LOADING:
      return {
        ...state,
        [action.layer]: {
          ...state[action.layer],
          loading: action.loading
        }
      }

    case LAYER_ACTIONS.SET_LAYER_ERROR:
      return {
        ...state,
        [action.layer]: {
          ...state[action.layer],
          error: action.error,
          loading: false
        }
      }

    case LAYER_ACTIONS.CLEAR_LAYER_FILTERS:
      return {
        ...state,
        [action.layer]: {
          ...state[action.layer],
          filters: initialLayerState[action.layer].filters
        }
      }

    case LAYER_ACTIONS.OPEN_MODAL:
      return {
        ...state,
        activeModal: action.modalType,
        selectedItem: action.item || null
      }

    case LAYER_ACTIONS.CLOSE_MODAL:
      return {
        ...state,
        activeModal: null,
        selectedItem: null
      }

    case LAYER_ACTIONS.SELECT_ITEM:
      return {
        ...state,
        selectedItem: action.item
      }

    default:
      return state
  }
}

// Layer context provider
export function LayerProvider({ children }) {
  const [state, dispatch] = useReducer(layerReducer, initialLayerState)

  // Action creators
  const actions = {
    toggleLayer: (layer) => {
      dispatch({ type: LAYER_ACTIONS.TOGGLE_LAYER, layer })
    },

    setLayerData: (layer, data) => {
      dispatch({ type: LAYER_ACTIONS.SET_LAYER_DATA, layer, data })
    },

    updateLayerFilters: (layer, filters) => {
      dispatch({ type: LAYER_ACTIONS.UPDATE_LAYER_FILTERS, layer, filters })
    },

    setLayerLoading: (layer, loading) => {
      dispatch({ type: LAYER_ACTIONS.SET_LAYER_LOADING, layer, loading })
    },

    setLayerError: (layer, error) => {
      dispatch({ type: LAYER_ACTIONS.SET_LAYER_ERROR, layer, error })
    },

    clearLayerFilters: (layer) => {
      dispatch({ type: LAYER_ACTIONS.CLEAR_LAYER_FILTERS, layer })
    },

    openModal: (modalType, item = null) => {
      dispatch({ type: LAYER_ACTIONS.OPEN_MODAL, modalType, item })
    },

    closeModal: () => {
      dispatch({ type: LAYER_ACTIONS.CLOSE_MODAL })
    },

    selectItem: (item) => {
      dispatch({ type: LAYER_ACTIONS.SELECT_ITEM, item })
    }
  }

  // Computed values
  const computed = {
    visibleLayers: Object.keys(state).filter(key => 
      key !== 'activeModal' && key !== 'selectedItem' && state[key].visible
    ),
    totalVisibleItems: state.jobs.visible ? state.jobs.count : 0 + 
                      state.cvs.visible ? state.cvs.count : 0,
    hasActiveFilters: (layer) => {
      const filters = state[layer].filters
      if (layer === 'jobs') {
        return filters.search || filters.country || filters.city || 
               filters.remote !== 'all' || filters.source.length > 0 ||
               filters.salary_min || filters.salary_max
      } else if (layer === 'cvs') {
        return filters.search || filters.country || filters.city || 
               filters.remote !== 'all' || filters.skills.length > 0 ||
               filters.education_level.length > 0 || 
               filters.timeline_types.length > 0 ||
               filters.experience_min || filters.experience_max
      }
      return false
    },
    isLayerEmpty: (layer) => state[layer].count === 0,
    isLayerLoading: (layer) => state[layer].loading,
    getLayerError: (layer) => state[layer].error
  }

  const contextValue = {
    state,
    actions,
    computed
  }

  return (
    <LayerContext.Provider value={contextValue}>
      {children}
    </LayerContext.Provider>
  )
}

// Custom hook for using layer context
export function useLayerContext() {
  const context = useContext(LayerContext)
  if (!context) {
    throw new Error('useLayerContext must be used within a LayerProvider')
  }
  return context
}

// Custom hook for specific layer
export function useLayer(layerName) {
  const { state, actions, computed } = useLayerContext()
  
  return {
    layer: state[layerName],
    toggleVisibility: () => actions.toggleLayer(layerName),
    updateFilters: (filters) => actions.updateLayerFilters(layerName, filters),
    clearFilters: () => actions.clearLayerFilters(layerName),
    setLoading: (loading) => actions.setLayerLoading(layerName, loading),
    setError: (error) => actions.setLayerError(layerName, error),
    setData: (data) => actions.setLayerData(layerName, data),
    hasActiveFilters: computed.hasActiveFilters(layerName),
    isEmpty: computed.isLayerEmpty(layerName),
    isLoading: computed.isLayerLoading(layerName),
    error: computed.getLayerError(layerName)
  }
}

// Custom hook for timeline modal management
export function useTimelineModal() {
  const { state, actions } = useLayerContext()
  
  return {
    isOpen: state.activeModal === 'timeline',
    selectedCV: state.selectedItem,
    open: (cvData) => actions.openModal('timeline', cvData),
    close: () => actions.closeModal()
  }
}

// Custom hook for layer controls
export function useLayerControls() {
  const { state, actions, computed } = useLayerContext()
  
  return {
    jobsVisible: state.jobs.visible,
    cvsVisible: state.cvs.visible,
    toggleJobs: () => actions.toggleLayer('jobs'),
    toggleCVs: () => actions.toggleLayer('cvs'),
    visibleLayers: computed.visibleLayers,
    totalItems: computed.totalVisibleItems,
    showAll: () => {
      if (!state.jobs.visible) actions.toggleLayer('jobs')
      if (!state.cvs.visible) actions.toggleLayer('cvs')
    },
    hideAll: () => {
      if (state.jobs.visible) actions.toggleLayer('jobs')
      if (state.cvs.visible) actions.toggleLayer('cvs')
    }
  }
}