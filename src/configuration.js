export const SCALE_FACTOR = 2;

export const DEFAULT_ROW_HEIGHT = 40 * SCALE_FACTOR;
export const DEFAULT_WIDTH = 1200 * SCALE_FACTOR;
export const DEFAULT_FONT_SIZE = 12 * SCALE_FACTOR;
export const DEFAULT_ROW_PADDING = 10 * SCALE_FACTOR;
export const DEFAULT_RADIUS = 5 * SCALE_FACTOR;
export const SLIDER_WIDTH = 10 * SCALE_FACTOR;
export const HEADER_BORDER_WIDTH = 1.5 * SCALE_FACTOR;
export const TODAY_MARKER_WIDTH = 1.5 * SCALE_FACTOR;
export const CONNECTION_OFFSET = 10 * SCALE_FACTOR;
export const CONNECTION_ARROW_WIDTH = (CONNECTION_OFFSET / 2);
export const CONNECTION_ARROW_HEIGHT = (CONNECTION_OFFSET / 3);
export const CONNECTION_LINE_WIDTH = 2;

export const MIN_COLUMN_WIDTH = 40 * SCALE_FACTOR;

export const COLORS = {
  milestone: {
    bar: {
      odd: {
        highlighted: "rgba(112, 162, 236, 0.8)",
        dragging: "rgba(112, 162, 236, 0.6)",
        draggingBorder: "rgba(61, 111, 185, 1)", // darkened, 20%
        default: "rgba(112, 162, 236, 1)",
        progress: "rgba(61, 111, 185, 1)", // darkened, 30%
        draggingSlider: "rgba(87, 137, 211, 1)",
        highlightedSlider: "rgba(87, 137, 211, 1)"
      },
      even: {
        highlighted: "rgba(111, 237, 124, 0.8)",
        dragging: "rgba(111, 237, 124, 0.6)",
        draggingBorder: "rgba(60, 186, 73, 1)", // darkened, 20%
        default: "rgba(111, 237, 124, 1)",
        progress: "rgba(35, 161, 48, 1)", // darkened, 30%
        draggingSlider: "rgba(42, 187, 115, 1)",
        highlightedSlider: "rgba(42, 187, 115, 1)"
      }
    },
    slider: {
      symbol: "rgba(0, 0, 0, 1.0)"
    },
    connection: {
      endToEnd: {
        line: "rgba(100, 100, 100, 1)"
      },
      endToStart: {
        line: "rgba(100, 100, 100, 1)"
      },
      startToStart: {
        line: "rgba(100, 100, 100, 1)"
      },
    }
  },
  scale: {
    bar: {
      odd: "rgba(255, 255, 255, 0.9)",
      even: "rgba(220, 225, 220, 0.4)"
    },
    marker: {
      today: "rgba(238, 156, 93, 1)"
    },
    header: {
      background: "rgba(255, 255, 255, 1)",
      border: "rgba(220, 225, 220, 0.4)"
    }
  }
};

export const FONTS = {
  scale: {
    column: {
      title: {
        color: "rgba(0, 0, 0, 1)",
        size: 12 * SCALE_FACTOR,
        font: "Arial"
      }
    }
  },
  milestone: {
    label: {
      color: "rgba(0, 0, 0, 1)",
      size: 12 * SCALE_FACTOR,
      font: "Arial"
    }
  }
};

export const HEADER_HEIGHT = FONTS.scale.column.title.size * 1.5;

export const RIGHT_SLIDER = Symbol("right");
export const LEFT_SLIDER = Symbol("left");

export const EVENT_TYPE = {
  MILESTONE_MOVED: 'milestonemove',
  MILESTONE_RESIZED: 'milestoneresize',
};
