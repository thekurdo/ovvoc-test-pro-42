// CartWidget — class component with connect() HOC
// Patterns that change in React 19 + Redux 5 + RTK 2:
//   - defaultProps on class components still works but is deprecated
//   - connect() HOC still works in react-redux 9 but hooks are preferred
//   - mapStateToProps / mapDispatchToProps pattern
const React = require('react');
const { connect } = require('react-redux');
const { addItem, removeItem, clearCart } = require('../store/cartSlice');

class CartWidget extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpanded: false,
    };
    this.toggleExpand = this.toggleExpand.bind(this);
    this.handleClear = this.handleClear.bind(this);
  }

  toggleExpand() {
    this.setState((prev) => ({ isExpanded: !prev.isExpanded }));
  }

  handleClear() {
    if (this.props.onBeforeClear) {
      this.props.onBeforeClear();
    }
    this.props.clearCart();
  }

  renderItems() {
    const { items, maxVisible } = this.props;
    const visibleItems = items.slice(0, maxVisible);
    const remaining = items.length - maxVisible;

    const elements = visibleItems.map((item) =>
      React.createElement(
        'div',
        { key: item.id, className: 'cart-item' },
        React.createElement('span', { className: 'cart-item__name' }, item.name),
        React.createElement(
          'span',
          { className: 'cart-item__qty' },
          `x${item.quantity}`
        ),
        React.createElement(
          'span',
          { className: 'cart-item__price' },
          `$${(item.price * item.quantity).toFixed(2)}`
        ),
        React.createElement(
          'button',
          {
            className: 'cart-item__remove',
            onClick: () => this.props.removeItem(item.id),
          },
          'Remove'
        )
      )
    );

    if (remaining > 0) {
      elements.push(
        React.createElement(
          'div',
          { key: 'remaining', className: 'cart-item--more' },
          `+${remaining} more item${remaining > 1 ? 's' : ''}`
        )
      );
    }

    return elements;
  }

  render() {
    const { items, total, itemCount, title, currency } = this.props;
    const { isExpanded } = this.state;

    return React.createElement(
      'div',
      { className: 'cart-widget' },
      React.createElement(
        'div',
        {
          className: 'cart-widget__header',
          onClick: this.toggleExpand,
          role: 'button',
          tabIndex: 0,
        },
        React.createElement('h4', null, title),
        React.createElement(
          'span',
          { className: 'cart-widget__badge' },
          itemCount
        )
      ),
      isExpanded &&
        React.createElement(
          'div',
          { className: 'cart-widget__body' },
          items.length === 0
            ? React.createElement('p', { className: 'cart-widget__empty' }, 'Cart is empty')
            : this.renderItems(),
          items.length > 0 &&
            React.createElement(
              'div',
              { className: 'cart-widget__footer' },
              React.createElement(
                'span',
                { className: 'cart-widget__total' },
                `Total: ${currency}${total.toFixed(2)}`
              ),
              React.createElement(
                'button',
                { className: 'btn btn--clear', onClick: this.handleClear },
                'Clear Cart'
              )
            )
        )
    );
  }
}

// defaultProps on class component — deprecated in React 19
CartWidget.defaultProps = {
  title: 'Shopping Cart',
  currency: '$',
  maxVisible: 5,
  onBeforeClear: null,
};

// mapStateToProps
function mapStateToProps(state) {
  return {
    items: state.cart.items,
    total: state.cart.total,
    itemCount: state.cart.itemCount,
  };
}

// mapDispatchToProps as object shorthand
const mapDispatchToProps = {
  addItem,
  removeItem,
  clearCart,
};

// connect() HOC — still works in react-redux 9 but hooks preferred
const ConnectedCartWidget = connect(mapStateToProps, mapDispatchToProps)(CartWidget);

module.exports = { CartWidget, ConnectedCartWidget };
