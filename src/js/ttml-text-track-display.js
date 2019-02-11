import videojs from 'video.js';
import dashjs from 'dashjs';
import window from 'global/window';

const Component = videojs.getComponent('Component');

const darkGray = '#222';
const lightGray = '#ccc';
const fontMap = {
  monospace: 'monospace',
  sansSerif: 'sans-serif',
  serif: 'serif',
  monospaceSansSerif: '"Andale Mono", "Lucida Console", monospace',
  monospaceSerif: '"Courier New", monospace',
  proportionalSansSerif: 'sans-serif',
  proportionalSerif: 'serif',
  casual: '"Comic Sans MS", Impact, fantasy',
  script: '"Monotype Corsiva", cursive',
  smallcaps: '"Andale Mono", "Lucida Console", monospace, sans-serif'
};

/**
 * Try to update the style of a DOM element. Some style changes will throw an error,
 * particularly in IE8. Those should be noops.
 *
 * @param {Element} el
 *        The DOM element to be styled.
 *
 * @param {string} style
 *        The CSS property on the element that should be styled.
 *
 * @param {string} rule
 *        The style rule that should be applied to the property.
 *
 * @private
 */
function tryUpdateStyle(el, style, rule) {
  try {
    el.style[style] = rule;
  } catch (e) {

    // Satisfies linter.
    return;
  }
}

function removeStyle(el) {
  if (el.style) {
    el.style.left = null;
    el.style.width = '100%';
  }
  for (const i in el.children) {
    removeStyle(el.children[i]);
  }
}

/**
 * Construct an rgba color from a given hex color code.
 *
 * @param {number} color
 *        Hex number for color, like #f0e or #f604e2.
 *
 * @param {number} opacity
 *        Value for opacity, 0.0 - 1.0.
 *
 * @return {string}
 *         The rgba color that was created, like 'rgba(255, 0, 0, 0.3)'.
 */
export function constructColor(color, opacity) {
  let hex;

  if (color.length === 4) {
    // color looks like "#f0e"
    hex = color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  } else if (color.length === 7) {
    // color looks like "#f604e2"
    hex = color.slice(1);
  } else {
    throw new Error('Invalid color code provided, ' + color + '; must be formatted as e.g. #f0e or #f604e2.');
  }
  return 'rgba(' +
    parseInt(hex.slice(0, 2), 16) + ',' +
    parseInt(hex.slice(2, 4), 16) + ',' +
    parseInt(hex.slice(4, 6), 16) + ',' +
    opacity + ')';
}

/**
 * The component for displaying text track cues.
 *
 * @extends Component
 */
class TTMLTextTrackDisplay extends Component {

  /**
   * Creates an instance of this class.
   *
   * @param {Player} player
   *        The `Player` that this class should be attached to.
   *
   * @param {Object} [options]
   *        The key/value store of player options.
   *
   * @param {Component~ReadyCallback} [ready]
   *        The function to call when `TextTrackDisplay` is ready.
   */
  constructor(player, options, ready) {
    super(player, videojs.mergeOptions(options, {playerOptions: {}}), ready);
    const selects = player.getChild('TextTrackSettings').$$('select');

    for (let i = 0; i < selects.length; i++) {
      this.on(selects[i], 'change', this.updateStyle.bind(this));
    }
    player.dash.mediaPlayer.on(dashjs.MediaPlayer.events.CAPTION_RENDERED,
      this.updateStyle.bind(this));
  }

  /**
   * Create the {@link Component}'s DOM element.
   *
   * @return {Element}
   *         The element that was created.
   */
  createEl() {
    const newEl = super.createEl('div', {
      className: 'vjs-text-track-display-ttml'
    }, {
      'aria-live': 'off',
      'aria-atomic': 'true'
    });

    newEl.style.position = 'absolute';
    newEl.style.left = '0';
    newEl.style.right = '0';
    newEl.style.top = '0';
    newEl.style.bottom = '0';
    newEl.style.margin = '1.5%';
    return newEl;
  }

  updateStyle({captionDiv}) {
    if (!this.player_.textTrackSettings) {
      return;
    }

    const overrides = this.player_.textTrackSettings.getValues();

    captionDiv = captionDiv || this.player_.getChild('TTMLTextTrackDisplay')
      .el().firstChild;
    if (!captionDiv) {
      return;
    }

    removeStyle(captionDiv);
    const spans = captionDiv.getElementsByTagName('span');

    for (let i = 0; i < spans.length; i++) {
      const span = spans[i];

      span.parentNode.style.textAlign = 'center';
      if (overrides.color) {
        span.style.color = overrides.color;
      }
      if (overrides.textOpacity) {
        tryUpdateStyle(
          span,
          'color',
          constructColor(
            overrides.color || '#fff',
            overrides.textOpacity
          )
        );
      }
      if (overrides.backgroundColor) {
        span.style.backgroundColor = overrides.backgroundColor;
      }
      if (overrides.backgroundOpacity) {
        tryUpdateStyle(
          span,
          'backgroundColor',
          constructColor(
            overrides.backgroundColor || '#000',
            overrides.backgroundOpacity
          )
        );
      }
      if (overrides.windowColor) {
        if (overrides.windowOpacity) {
          tryUpdateStyle(
            span.parentNode,
            'backgroundColor',
            constructColor(overrides.windowColor, overrides.windowOpacity)
          );
        } else {
          span.parent.style.backgroundColor = overrides.windowColor;
        }
      }
      if (overrides.edgeStyle) {
        if (overrides.edgeStyle === 'dropshadow') {
          span.style.textShadow = `2px 2px 3px ${darkGray}, 2px 2px 4px ${darkGray}, 2px 2px 5px ${darkGray}`;
        } else if (overrides.edgeStyle === 'raised') {
          span.style.textShadow = `1px 1px ${darkGray}, 2px 2px ${darkGray}, 3px 3px ${darkGray}`;
        } else if (overrides.edgeStyle === 'depressed') {
          span.style.textShadow = `1px 1px ${lightGray}, 0 1px ${lightGray}, -1px -1px ${darkGray}, 0 -1px ${darkGray}`;
        } else if (overrides.edgeStyle === 'uniform') {
          span.style.textShadow = `0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}, 0 0 4px ${darkGray}`;
        }
      }
      if (overrides.fontPercent && overrides.fontPercent !== 1) {
        const fontSize = window.parseFloat(span.style.fontSize);

        span.style.fontSize = (fontSize * overrides.fontPercent) + 'px';
        span.style.height = 'auto';
        span.style.top = 'auto';
        span.style.bottom = '2px';
      }
      if (overrides.fontFamily && overrides.fontFamily !== 'default') {
        if (overrides.fontFamily === 'small-caps') {
          span.style.fontVariant = 'small-caps';
        } else {
          span.style.fontFamily = fontMap[overrides.fontFamily];
        }
      }
    }
  }

}
videojs.registerComponent('TTMLTextTrackDisplay', TTMLTextTrackDisplay);
