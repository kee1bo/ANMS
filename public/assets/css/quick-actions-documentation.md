# Quick Actions Panel Styling Documentation

## Overview
The Quick Actions Panel provides users with easy access to common tasks from the dashboard. The styling system includes comprehensive support for different states, responsive design, and accessibility features.

## CSS Classes and Structure

### Container Classes
- `.quick-actions` - Main container for the quick actions panel
- `.actions-grid` - Grid layout for action buttons

### Button Classes
- `.quick-action-btn` - Base class for all quick action buttons
- `.quick-action-btn.disabled` - Disabled state styling
- `.quick-action-btn.loading` - Loading state with spinner animation
- `.quick-action-btn.success` - Success state with check icon and animation

### State-Specific Styling

#### Default State
- Gradient background from gray-50 to gray-100
- Subtle border and shadow
- Smooth transitions for all interactions

#### Hover State
- Enhanced gradient background
- Increased elevation with box-shadow
- Scale and translate transforms for depth
- Color changes to primary theme colors

#### Disabled State
- Reduced opacity (60%)
- Grayed out colors
- Tooltip showing reason for disabled state
- No hover effects or interactions

#### Loading State
- Spinning icon animation
- Reduced opacity
- Pointer events disabled
- ARIA busy attribute for accessibility

#### Success State
- Green color scheme
- Bounce animation for icon
- Check mark icon replacement
- Auto-revert after specified duration

## Action-Specific Styling

Each action type has its own color scheme:

### Add Pet (`add_pet`)
- **Colors**: Green theme (green-50 to green-600)
- **Purpose**: Indicates growth/addition
- **Icon**: Plus icon (fa-plus)

### Plan Meal (`plan_meal`)
- **Colors**: Orange theme (orange-50 to orange-600)
- **Purpose**: Represents food/nutrition
- **Icon**: Utensils icon (fa-utensils)

### Calculate Nutrition (`calculate_nutrition`)
- **Colors**: Blue theme (blue-50 to blue-600)
- **Purpose**: Represents calculation/analysis
- **Icon**: Calculator icon (fa-calculator)

### Log Health (`log_health`)
- **Colors**: Red theme (red-50 to red-600)
- **Purpose**: Represents health/medical
- **Icon**: Heart icon (fa-heart)

### Upload Photo (`upload_photo`)
- **Colors**: Purple theme (purple-50 to purple-600)
- **Purpose**: Represents media/creativity
- **Icon**: Camera icon (fa-camera)

## Responsive Design

### Desktop (>768px)
- Grid: `repeat(auto-fit, minmax(160px, 1fr))`
- Button padding: `1.5rem 1rem`
- Icon size: `1.75rem`
- Minimum height: `120px`

### Tablet (≤768px)
- Grid: `repeat(auto-fit, minmax(140px, 1fr))`
- Button padding: `1.25rem 0.75rem`
- Icon size: `1.5rem`
- Minimum height: `100px`

### Mobile (≤480px)
- Grid: `repeat(2, 1fr)` (2 columns)
- Button padding: `1rem 0.5rem`
- Icon size: `1.375rem`
- Minimum height: `90px`

## Accessibility Features

### ARIA Attributes
- `aria-label` - Descriptive labels for screen readers
- `aria-disabled` - Indicates disabled state
- `aria-busy` - Indicates loading state
- `aria-hidden` - Hides decorative icons from screen readers

### Keyboard Navigation
- Full keyboard support with focus indicators
- Tab order follows visual layout
- Enter/Space key activation

### Screen Reader Support
- Descriptive labels for all actions
- State announcements (disabled, loading, success)
- Proper semantic markup

### High Contrast Mode
- Enhanced borders and contrast ratios
- Maintains usability in high contrast environments
- WCAG 2.1 AA compliance

### Reduced Motion
- Respects `prefers-reduced-motion` setting
- Disables animations and transitions when requested
- Maintains functionality without motion

## Touch Device Optimizations

### Touch Targets
- Minimum 44px touch target size
- Adequate spacing between buttons
- Touch-friendly hover states

### Touch Interactions
- Active state feedback with scale transform
- No hover effects on touch-only devices
- Optimized for finger navigation

## Animation System

### Hover Animations
- `transform: translateY(-3px) scale(1.02)` - Lift effect
- `transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` - Smooth easing
- Background gradient transitions

### Loading Animation
- `@keyframes spin` - 360-degree rotation
- Applied to icons during loading state
- 1-second linear infinite duration

### Success Animation
- `@keyframes bounce` - Multi-stage bounce effect
- Applied to icons during success state
- 0.6-second ease timing

## Color System

The styling uses CSS custom properties for consistent theming:

```css
/* Primary colors */
--primary-50 to --primary-900

/* Semantic colors */
--green-50 to --green-900 (success/add)
--orange-50 to --orange-900 (warning/food)
--blue-50 to --blue-900 (info/calculation)
--red-50 to --red-900 (health/medical)
--purple-50 to --purple-900 (media/creative)

/* Neutral colors */
--gray-50 to --gray-900
```

## Usage Examples

### Basic Implementation
```html
<div class="quick-actions">
    <h3><i class="fas fa-zap"></i> Quick Actions</h3>
    <div class="actions-grid">
        <button class="quick-action-btn" data-quick-action="add_pet" data-priority="1">
            <i class="fas fa-plus" aria-hidden="true"></i>
            <span>Add New Pet</span>
        </button>
    </div>
</div>
```

### JavaScript Integration
```javascript
// Set loading state
quickActions.setActionLoading('add_pet', true);

// Set success state
quickActions.setActionSuccess('add_pet', 2000);

// Update button state
quickActions.updateActionButton('add_pet', action);
```

## Browser Support

- **Modern Browsers**: Full feature support
- **IE11**: Graceful degradation (no CSS Grid, reduced animations)
- **Safari**: Full support with vendor prefixes
- **Mobile Browsers**: Optimized touch interactions

## Performance Considerations

- CSS transforms use GPU acceleration
- Animations use `transform` and `opacity` for optimal performance
- Minimal repaints and reflows
- Efficient selector specificity

## Customization

The styling system is designed to be easily customizable:

1. **Colors**: Modify CSS custom properties in `:root`
2. **Spacing**: Adjust padding and gap values
3. **Animations**: Modify transition durations and easing functions
4. **Responsive**: Adjust breakpoints and grid configurations

## Testing

The styling includes comprehensive test coverage:

- Visual regression tests for all states
- Accessibility testing with screen readers
- Cross-browser compatibility testing
- Mobile device testing
- Performance profiling

## Maintenance

Regular maintenance tasks:

1. Update color values for brand consistency
2. Test new browser versions
3. Validate accessibility compliance
4. Monitor performance metrics
5. Update documentation for new features