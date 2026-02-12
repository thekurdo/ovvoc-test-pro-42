// Test suite for React 18 + Redux 4 + RTK 1.x patterns
// All tests must pass with OLD versions and would break/warn with new versions

const assert = require("assert");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  PASS: " + name);
  } catch (err) {
    failed++;
    console.error("  FAIL: " + name);
    console.error("        " + err.message);
  }
}

console.log("");
console.log("=== ovvoc-test-pro-42: React 18 + Redux 4 + RTK 1.x ===");
console.log("");

// ---- Redux core tests ----
console.log("--- Redux Core ---");

test("redux createStore is available (deprecated but present in redux 4)", function() {
  var createStore = require("redux").createStore;
  assert.strictEqual(typeof createStore, "function");
  var reducer = function(state, action) {
    if (state === undefined) state = { count: 0 };
    if (action.type === "INC") return { count: state.count + 1 };
    return state;
  };
  var store = createStore(reducer);
  store.dispatch({ type: "INC" });
  assert.strictEqual(store.getState().count, 1);
});

test("redux combineReducers works", function() {
  var redux = require("redux");
  var rootReducer = redux.combineReducers({
    a: function(state, action) { if (state === undefined) state = 0; return action.type === "A" ? state + 1 : state; },
    b: function(state, action) { if (state === undefined) state = "hello"; return action.type === "B" ? "world" : state; },
  });
  var store = redux.createStore(rootReducer);
  store.dispatch({ type: "A" });
  assert.deepStrictEqual(store.getState(), { a: 1, b: "hello" });
});
// ---- RTK tests ----
console.log("");
console.log("--- Redux Toolkit ---");

test("getDefaultMiddleware is importable from @reduxjs/toolkit (removed in RTK 2)", function() {
  var rtk = require("@reduxjs/toolkit");
  assert.strictEqual(typeof rtk.getDefaultMiddleware, "function");
  var middleware = rtk.getDefaultMiddleware();
  assert.ok(Array.isArray(middleware) || typeof middleware.concat === "function");
});

test("configureStore works with RTK 1.x pattern", function() {
  var rtk = require("@reduxjs/toolkit");
  var store = rtk.configureStore({
    reducer: {
      test: function(state, action) {
        if (state === undefined) state = { value: 0 };
        if (action.type === "test/increment") return { value: state.value + 1 };
        return state;
      },
    },
    middleware: rtk.getDefaultMiddleware().concat(function(storeApi) {
      return function(next) {
        return function(action) { return next(action); };
      };
    }),
  });
  store.dispatch({ type: "test/increment" });
  assert.strictEqual(store.getState().test.value, 1);
});

test("createSlice works with reducers and prepare callbacks", function() {
  var rtk = require("@reduxjs/toolkit");
  var slice = rtk.createSlice({
    name: "counter",
    initialState: { value: 0, history: [] },
    reducers: {
      increment: function(state) { state.value += 1; },
      addWithMeta: {
        reducer: function(state, action) {
          state.value += action.payload.amount;
          state.history.push(action.payload);
        },
        prepare: function(amount) {
          return { payload: { amount: amount, timestamp: Date.now() } };
        },
      },
    },
  });
  assert.strictEqual(typeof slice.actions.increment, "function");
  assert.strictEqual(typeof slice.actions.addWithMeta, "function");
  var action = slice.actions.addWithMeta(5);
  assert.strictEqual(action.payload.amount, 5);
  assert.ok(action.payload.timestamp > 0);
});

test("createAsyncThunk works", function() {
  var rtk = require("@reduxjs/toolkit");
  var thunk = rtk.createAsyncThunk("test/fetch", async function(arg) {
    return { data: arg };
  });
  assert.strictEqual(typeof thunk, "function");
  assert.strictEqual(typeof thunk.pending, "function");
  assert.strictEqual(typeof thunk.fulfilled, "function");
  assert.strictEqual(typeof thunk.rejected, "function");
  assert.strictEqual(thunk.pending.type, "test/fetch/pending");
});

test("createSlice extraReducers builder pattern works", function() {
  var rtk = require("@reduxjs/toolkit");
  var fetchData = rtk.createAsyncThunk("data/fetch", async function() { return { result: 42 }; });
  var slice = rtk.createSlice({
    name: "data",
    initialState: { value: null, loading: false },
    reducers: {},
    extraReducers: function(builder) {
      builder
        .addCase(fetchData.pending, function(state) { state.loading = true; })
        .addCase(fetchData.fulfilled, function(state, action) {
          state.loading = false;
          state.value = action.payload.result;
        });
    },
  });
  assert.strictEqual(typeof slice.reducer, "function");
});
// ---- Store integration test ----
console.log("");
console.log("--- Store Integration ---");

test("store from src/store/index.js initializes correctly", function() {
  var myStore = require("../src/store/index").store;
  var state = myStore.getState();
  assert.ok(state.user !== undefined, "user slice exists");
  assert.ok(state.cart !== undefined, "cart slice exists");
  assert.strictEqual(state.user.profile, null);
  assert.deepStrictEqual(state.cart.items, []);
  assert.strictEqual(state.cart.total, 0);
});

test("userSlice reducers work correctly", function() {
  var rtk = require("@reduxjs/toolkit");
  var userSlice = require("../src/store/userSlice");
  var myStore = rtk.configureStore({ reducer: { user: userSlice.userReducer } });

  myStore.dispatch(userSlice.setTheme("dark"));
  assert.strictEqual(myStore.getState().user.preferences.theme, "dark");

  myStore.dispatch(userSlice.toggleAutoUpdate());
  assert.strictEqual(myStore.getState().user.preferences.autoUpdate, true);

  myStore.dispatch(userSlice.addNotification("Test message", "warning"));
  var notifs = myStore.getState().user.notifications;
  assert.strictEqual(notifs.length, 1);
  assert.strictEqual(notifs[0].message, "Test message");
  assert.strictEqual(notifs[0].level, "warning");
  assert.strictEqual(notifs[0].read, false);
});

test("cartSlice with Immer mutations and prepare callbacks", function() {
  var rtk = require("@reduxjs/toolkit");
  var cartSlice = require("../src/store/cartSlice");
  var myStore = rtk.configureStore({ reducer: { cart: cartSlice.cartReducer } });

  // Add items using prepare callback
  myStore.dispatch(cartSlice.addItem("item-1", "Widget", 9.99, 2));
  var cart = myStore.getState().cart;
  assert.strictEqual(cart.items.length, 1);
  assert.strictEqual(cart.items[0].name, "Widget");
  assert.strictEqual(cart.items[0].quantity, 2);
  assert.strictEqual(cart.total, 19.98);
  assert.strictEqual(cart.itemCount, 2);

  // Add same item again (should merge)
  myStore.dispatch(cartSlice.addItem("item-1", "Widget", 9.99, 3));
  cart = myStore.getState().cart;
  assert.strictEqual(cart.items.length, 1);
  assert.strictEqual(cart.items[0].quantity, 5);
  assert.strictEqual(cart.total, 49.95);

  // Add different item
  myStore.dispatch(cartSlice.addItem("item-2", "Gadget", 24.50, 1));
  cart = myStore.getState().cart;
  assert.strictEqual(cart.items.length, 2);
  assert.strictEqual(cart.itemCount, 6);

  // Apply coupon
  myStore.dispatch(cartSlice.applyCoupon({ code: "SAVE10", percentage: 10 }));
  cart = myStore.getState().cart;
  assert.strictEqual(cart.coupon, "SAVE10");
  assert.ok(cart.total < 74.45); // 10% discount applied

  // Update quantity
  myStore.dispatch(cartSlice.updateQuantity("item-1", 1));
  cart = myStore.getState().cart;
  var item1 = cart.items.find(function(i) { return i.id === "item-1"; });
  assert.strictEqual(item1.quantity, 1);

  // Remove item
  myStore.dispatch(cartSlice.removeItem("item-2"));
  cart = myStore.getState().cart;
  assert.strictEqual(cart.items.length, 1);
});
// ---- React tests ----
console.log("");
console.log("--- React ---");

test("React.forwardRef is available", function() {
  var React = require("react");
  assert.strictEqual(typeof React.forwardRef, "function");
  var MyComp = React.forwardRef(function MyComp(props, ref) {
    return React.createElement("div", { ref: ref }, props.children);
  });
  assert.ok(MyComp.$typeof !== undefined || MyComp.render !== undefined);
});

test("defaultProps works on forwardRef component", function() {
  var React = require("react");
  var Comp = React.forwardRef(function Comp(props, ref) {
    return React.createElement("span", { ref: ref }, props.label);
  });
  Comp.defaultProps = { label: "default-label" };
  assert.strictEqual(Comp.defaultProps.label, "default-label");
});

test("React.createElement works for component tree", function() {
  var React = require("react");
  var el = React.createElement(
    "div",
    { className: "container" },
    React.createElement("h1", null, "Title"),
    React.createElement("p", null, "Content")
  );
  assert.strictEqual(el.type, "div");
  assert.strictEqual(el.props.className, "container");
  assert.strictEqual(el.props.children.length, 2);
});

test("UserCard component has defaultProps and forwardRef", function() {
  var UserCard = require("../src/components/UserCard").UserCard;
  assert.ok(UserCard.defaultProps, "UserCard should have defaultProps");
  assert.strictEqual(UserCard.defaultProps.showEmail, true);
  assert.strictEqual(UserCard.defaultProps.showPlan, true);
  assert.strictEqual(UserCard.displayName, "UserCard");
});

test("CartWidget class has defaultProps", function() {
  var CartWidget = require("../src/components/CartWidget").CartWidget;
  assert.ok(CartWidget.defaultProps, "CartWidget should have defaultProps");
  assert.strictEqual(CartWidget.defaultProps.title, "Shopping Cart");
  assert.strictEqual(CartWidget.defaultProps.currency, "$");
  assert.strictEqual(CartWidget.defaultProps.maxVisible, 5);
});

// ---- react-redux tests ----
console.log("");
console.log("--- React-Redux ---");

test("connect HOC is available from react-redux", function() {
  var connect = require("react-redux").connect;
  assert.strictEqual(typeof connect, "function");
});

test("useSelector and useDispatch hooks are available", function() {
  var rr = require("react-redux");
  assert.strictEqual(typeof rr.useSelector, "function");
  assert.strictEqual(typeof rr.useDispatch, "function");
});

test("Provider is available from react-redux", function() {
  var Provider = require("react-redux").Provider;
  assert.ok(Provider, "Provider should be available");
});

// ---- Version checks ----
console.log("");
console.log("--- Version Checks ---");

test("react version is 18.x", function() {
  var React = require("react");
  assert.ok(React.version.startsWith("18."), "Expected 18.x, got " + React.version);
});

test("redux version is 4.x", function() {
  var pkg = require("redux/package.json");
  assert.ok(pkg.version.startsWith("4."), "Expected 4.x, got " + pkg.version);
});

test("@reduxjs/toolkit version is 1.9.x", function() {
  var pkg = require("@reduxjs/toolkit/package.json");
  assert.ok(pkg.version.startsWith("1.9."), "Expected 1.9.x, got " + pkg.version);
});

test("react-redux version is 8.x", function() {
  var pkg = require("react-redux/package.json");
  assert.ok(pkg.version.startsWith("8."), "Expected 8.x, got " + pkg.version);
});

// ---- Summary ----
console.log("");
console.log("=== Results: " + passed + " passed, " + failed + " failed, " + (passed + failed) + " total ===");
console.log("");
process.exit(failed > 0 ? 1 : 0);