// RTK 1.x store configuration
// Uses getDefaultMiddleware which is removed in RTK 2.x
const { configureStore, getDefaultMiddleware } = require('@reduxjs/toolkit');
const { userReducer } = require('./userSlice');
const { cartReducer } = require('./cartSlice');

// Simple logger middleware
const logger = (store) => (next) => (action) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Redux] dispatching:', action.type);
  }
  const result = next(action);
  return result;
};

// RTK 1.x pattern: getDefaultMiddleware() is a function import
// In RTK 2.x, getDefaultMiddleware is removed — middleware callback receives it as param
const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
  },
  middleware: getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['user/fetchProfile/fulfilled'],
    },
    thunk: {
      extraArgument: { apiBaseUrl: 'https://api.example.com' },
    },
  }).concat(logger),
  devTools: process.env.NODE_ENV !== 'production',
});

module.exports = { store };
