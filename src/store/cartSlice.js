// Cart slice with Immer mutable reducers and prepare callbacks
const { createSlice } = require('@reduxjs/toolkit');

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    total: 0,
    itemCount: 0,
    coupon: null,
    discount: 0,
    lastUpdated: null,
  },
  reducers: {
    // Mutable Immer reducer — push directly into array
    addItem: {
      reducer(state, action) {
        const existing = state.items.find((item) => item.id === action.payload.id);
        if (existing) {
          existing.quantity += action.payload.quantity;
        } else {
          state.items.push(action.payload);
        }
        recalculateTotals(state);
        state.lastUpdated = action.payload.addedAt;
      },
      // prepare callback normalizes the input
      prepare(id, name, price, quantity = 1) {
        return {
          payload: {
            id,
            name,
            price: Math.round(price * 100) / 100,
            quantity,
            addedAt: new Date().toISOString(),
          },
        };
      },
    },

    removeItem(state, action) {
      const index = state.items.findIndex((item) => item.id === action.payload);
      if (index !== -1) {
        state.items.splice(index, 1);
        recalculateTotals(state);
        state.lastUpdated = new Date().toISOString();
      }
    },

    updateQuantity: {
      reducer(state, action) {
        const item = state.items.find((i) => i.id === action.payload.id);
        if (item) {
          item.quantity = action.payload.quantity;
          if (item.quantity <= 0) {
            state.items = state.items.filter((i) => i.id !== action.payload.id);
          }
          recalculateTotals(state);
          state.lastUpdated = new Date().toISOString();
        }
      },
      prepare(id, quantity) {
        return {
          payload: { id, quantity: Math.max(0, quantity) },
        };
      },
    },

    applyCoupon(state, action) {
      const { code, percentage } = action.payload;
      state.coupon = code;
      state.discount = percentage;
      recalculateTotals(state);
    },

    removeCoupon(state) {
      state.coupon = null;
      state.discount = 0;
      recalculateTotals(state);
    },

    clearCart(state) {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      state.coupon = null;
      state.discount = 0;
      state.lastUpdated = new Date().toISOString();
    },
  },
});

// Helper function to recalculate totals (works with Immer draft)
function recalculateTotals(state) {
  const subtotal = state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  state.itemCount = state.items.reduce((count, item) => count + item.quantity, 0);
  state.total = state.discount > 0
    ? Math.round(subtotal * (1 - state.discount / 100) * 100) / 100
    : Math.round(subtotal * 100) / 100;
}

const { addItem, removeItem, updateQuantity, applyCoupon, removeCoupon, clearCart } =
  cartSlice.actions;
const cartReducer = cartSlice.reducer;

module.exports = {
  cartReducer,
  addItem,
  removeItem,
  updateQuantity,
  applyCoupon,
  removeCoupon,
  clearCart,
};
