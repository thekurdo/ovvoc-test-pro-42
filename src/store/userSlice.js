// User slice with createAsyncThunk and builder pattern extraReducers
const { createSlice, createAsyncThunk } = require('@reduxjs/toolkit');

// Async thunk for fetching user profile
const fetchProfile = createAsyncThunk(
  'user/fetchProfile',
  async (userId, { extra, rejectWithValue }) => {
    try {
      // Simulated API call
      const mockData = {
        id: userId,
        name: 'Jane Doe',
        email: 'jane@example.com',
        plan: 'pro',
        joinedAt: '2024-01-15T00:00:00Z',
      };
      return mockData;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Async thunk for updating user settings
const updateSettings = createAsyncThunk(
  'user/updateSettings',
  async (settings, { getState, rejectWithValue }) => {
    try {
      const { user } = getState();
      if (!user.profile) {
        return rejectWithValue('No profile loaded');
      }
      // Simulated update
      return { ...user.profile, ...settings };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: {
    profile: null,
    loading: false,
    error: null,
    notifications: [],
    preferences: {
      theme: 'light',
      emailDigest: true,
      autoUpdate: false,
    },
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setTheme(state, action) {
      state.preferences.theme = action.payload;
    },
    toggleAutoUpdate(state) {
      state.preferences.autoUpdate = !state.preferences.autoUpdate;
    },
    addNotification: {
      reducer(state, action) {
        state.notifications.push(action.payload);
      },
      prepare(message, level = 'info') {
        return {
          payload: {
            id: Date.now(),
            message,
            level,
            read: false,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
    markNotificationRead(state, action) {
      const notif = state.notifications.find((n) => n.id === action.payload);
      if (notif) {
        notif.read = true;
      }
    },
  },
  // Builder pattern for extraReducers (this pattern works in both RTK 1.x and 2.x)
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.error = action.payload || 'Failed to update settings';
      });
  },
});

const { clearError, setTheme, toggleAutoUpdate, addNotification, markNotificationRead } =
  userSlice.actions;
const userReducer = userSlice.reducer;

module.exports = {
  userReducer,
  fetchProfile,
  updateSettings,
  clearError,
  setTheme,
  toggleAutoUpdate,
  addNotification,
  markNotificationRead,
};
