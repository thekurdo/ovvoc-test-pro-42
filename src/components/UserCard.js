// UserCard component using React.forwardRef and defaultProps
// These patterns change in React 19:
//   - React.forwardRef is no longer needed (ref is a regular prop)
//   - defaultProps on function components is deprecated
const React = require('react');
const { useSelector, useDispatch } = require('react-redux');
const { setTheme, toggleAutoUpdate } = require('../store/userSlice');

// React.forwardRef pattern — unnecessary in React 19 (ref becomes a regular prop)
const UserCard = /* TODO: forwardRef is no longer needed in React 19 - ref is a regular prop */function UserCard(props, ref) {
  const { showEmail, showPlan, className } = props;

  // react-redux hooks (these work across versions)
  const profile = useSelector((state) => state.user.profile);
  const theme = useSelector((state) => state.user.preferences.theme);
  const dispatch = useDispatch();

  const handleThemeToggle = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  const handleAutoUpdateToggle = () => {
    dispatch(toggleAutoUpdate());
  };

  if (!profile) {
    return React.createElement('div', { ref, className: 'user-card--empty' }, 'No user loaded');
  }

  return React.createElement(
    'div',
    { ref, className: `user-card ${className || ''}`.trim() },
    React.createElement('h3', { className: 'user-card__name' }, profile.name),
    showEmail &&
      React.createElement('p', { className: 'user-card__email' }, profile.email),
    showPlan &&
      React.createElement(
        'span',
        { className: `user-card__plan user-card__plan--${profile.plan}` },
        profile.plan.toUpperCase()
      ),
    React.createElement(
      'div',
      { className: 'user-card__actions' },
      React.createElement(
        'button',
        { onClick: handleThemeToggle, className: 'btn btn--theme' },
        `Theme: ${theme}`
      ),
      React.createElement(
        'button',
        { onClick: handleAutoUpdateToggle, className: 'btn btn--auto-update' },
        'Toggle Auto-Update'
      )
    )
  );
});

// defaultProps — deprecated for function components in React 18.3+, removed in React 19
UserCard.defaultProps = {
  showEmail: true,
  showPlan: true,
  className: '',
};

UserCard.displayName = 'UserCard';

module.exports = { UserCard };
