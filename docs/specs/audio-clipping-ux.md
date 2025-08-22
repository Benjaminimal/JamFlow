# Audio Clipping UX Flow & State Specification

## UX Flow Design Decisions

### Core Principle

**Preserve user's listening context** - When someone is 43 minutes into a track and wants to clip something, they should be able to return to exactly where they were without losing their place.

### Clipping Mode Flow

#### Entering Clipping Mode

1. User is listening at position `43:20`
2. User clicks "Create Clip" button
3. **Save current position as `resumePosition: 43:20`**
4. Enter clipping mode with initial clip bounds around current time
5. Pause main playback

#### Adjusting Clip Bounds

- **Moving start/end handles**: No auto-play (prevents jarring interruptions)
- **Visual feedback only**: Show time stamps, highlight selected region
- **Explicit preview**: Separate "Preview Clip" toggle for intentional listening

#### Preview Behavior

- "Preview Clip" toggles looping selected region
- Loop restarts at clip start when:
  - User adjusts clip start
  - User adjusts clip end to be before current preview position

#### Exiting Clipping Mode

- **Save Clip**: Create clip, resume playback at `resumePosition`
- **Cancel**: Discard clip, resume playback at `resumePosition`
- **Server Error**: Stay in clipping mode, allow retry, resume at `resumePosition` when cancelled

## State Architecture

```typescript
interface AudioState {
  // Global playback state
  currentTime: number; // Current position in main timeline (seconds)
  duration: number; // Total track length
  isPlaying: boolean; // Main playback state

  // Clipping state
  isClippingMode: boolean; // Whether we're in clipping UI
  clipStart: number | null; // Clip start time (seconds)
  clipEnd: number | null; // Clip end time (seconds)

  // Preview state
  previewMode: "none" | "clip"; // What we're currently previewing
  isPreviewPlaying: boolean; // Preview playback state

  // Context preservation
  resumePosition: number; // Where to resume when exiting clip mode
}
```

## Technical Requirements from Audio Library

### Must Have

- `seek(time)` - Jump to specific timestamp
- `play()` / `pause()` - Playback control
- `position` - Current time tracking with callbacks
- Precise time control (sub-second accuracy)

### Nice to Have

- Playback rate control (for preview fine-tuning)
- Loop functionality (for clip preview)
- Buffering state (for long tracks)

## User Stories

### Primary Flow

```
As a user listening to a long track,
I want to clip interesting moments,
So that I can save and share them later,
Without losing my place in the main content.
```

### Edge Cases

- **Network issues during save**: Keep clip data, allow retry
- **Accidentally entering clip mode**: Quick exit should resume seamlessly
- **Very short clips** (e.g. < 1 second): Should not be allowed
- **Clip bounds at track edges**: Handle start=0 and end=duration gracefully

## Implementation Notes

### State Management Strategy

- Use React state for UI-only state (preview playing, clip bounds)
- Consider context/reducer for complex interactions
- Keep resume position in sync with main playback

### Performance Considerations

- Don't re-render heavily during handle dragging
- Debounce time updates to avoid excessive re-renders
- Cache clip preview data to avoid re-seeking

## Future Enhancements

### Phase 2: Waveform Integration

- Visual waveform with clip bounds overlay
- Click-to-seek on waveform
- Zoom functionality for precise editing
