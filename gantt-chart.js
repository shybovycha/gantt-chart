import {
  addMilliseconds,
  // startOfDay,
  format as formatDate,
  min as minDate,
  max as maxDate
} from "date-fns";

const SCALE_FACTOR = 2;

const DEFAULT_ROW_HEIGHT = 40 * SCALE_FACTOR;
const DEFAULT_WIDTH = 1200 * SCALE_FACTOR;
const DEFAULT_FONT_SIZE = 12 * SCALE_FACTOR;
const DEFAULT_ROW_PADDING = 10 * SCALE_FACTOR;
const DEFAULT_RADIUS = 5 * SCALE_FACTOR;
const SLIDER_WIDTH = 10 * SCALE_FACTOR;
const HEADER_BORDER_WIDTH = 1.5 * SCALE_FACTOR;
const TODAY_MARKER_WIDTH = 1.5 * SCALE_FACTOR;

const COLORS = {
  milestone: {
    bar: {
      odd: {
        highlighted: "rgba(112, 162, 236, 0.8)",
        dragging: "rgba(112, 162, 236, 0.6)",
        draggingBorder: "rgba(74, 137, 232, 1)",
        default: "rgba(112, 162, 236, 1)"
      },
      even: {
        highlighted: "rgba(93, 238, 166, 0.8)",
        dragging: "rgba(93, 238, 166, 0.6)",
        draggingBorder: "rgba(42, 187, 115, 0.2)",
        default: "rgba(93, 238, 166, 1)"
      }
    },
    slider: {
      odd: {
        dragging: "rgba(87, 137, 211, 1)",
        highlighted: "rgba(61, 111, 185, 1)"
      },
      even: {
        dragging: "rgba(42, 187, 115, 1)",
        highlighted: "rgba(17, 162, 90, 1)"
      },
      symbol: "rgba(0, 0, 0, 1.0)"
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

const FONTS = {
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

const RIGHT_SLIDER = Symbol("right");
const LEFT_SLIDER = Symbol("left");

const EVENT_TYPE = {
  MILESTONE_MOVED: 'milestonemove',
  MILESTONE_RESIZED: 'milestoneresize',
};

const roundRect = (ctx, x, y, width, height, radius, fill, stroke) => {
  if (typeof stroke === "undefined") {
    stroke = false;
  }

  if (typeof radius === "undefined") {
    radius = 0;
  }

  if (typeof radius === "number") {
    radius = {
      topRight: radius,
      topLeft: radius,
      bottomRight: radius,
      bottomLeft: radius,
    };
  } else {
    const defaultRadius = {
      topLeft: 0,
      topRight: 0,
      bottomRight: 0,
      bottomLeft: 0,
    };

    for (let side of defaultRadius) {
      radius[side] = radius[side] || defaultRadius[side];
    }
  }

  ctx.beginPath();

  ctx.moveTo(x + radius.topLeft, y);

  ctx.lineTo(x + width - radius.topRight, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.topRight);

  ctx.lineTo(x + width, y + height - radius.bottomRight);
  ctx.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius.bottomRight,
    y + height
  );

  ctx.lineTo(x + radius.bottomLeft, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bottomLeft);

  ctx.lineTo(x, y + radius.topLeft);
  ctx.quadraticCurveTo(x, y, x + radius.topLeft, y);

  ctx.closePath();

  if (fill) {
    ctx.fill();
  }

  if (stroke) {
    ctx.stroke();
  }
};

export class GanttChart extends EventTarget {
  constructor(parentElt, milestones) {
    super();

    this.milestones = milestones;

    this.initializeCanvas(parentElt);

    this.initializeScale();

    this.initializeColumns();
    this.initializeBars();

    this.initializeEventHandlers();

    this.addEventHandlers();
  }

  initializeCanvas(parentElt) {
    this.canvas = document.createElement("canvas");
    parentElt.appendChild(this.canvas);

    this.canvasWidth = this.canvas.outerWidth || DEFAULT_WIDTH;
    this.canvasHeight =
      this.canvas.outerHeight ||
      (this.milestones.length + 1) * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2);

    this.canvas.style.width = `${this.canvasWidth / SCALE_FACTOR}px`;
    this.canvas.style.height = `${this.canvasHeight / SCALE_FACTOR}px`;

    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    this.ctx = this.canvas.getContext("2d");
  }

  initializeScale() {
    // create header / scale
    // find the shortest and the longest milestones
    this.minStart = minDate(this.milestones.map(({ start }) => start));
    this.maxEnd = maxDate(this.milestones.map(({ end }) => end));

    this.overallDuration = this.maxEnd.getTime() - this.minStart.getTime();
  }

  initializeColumns() {
    this.columnDuration = 24 * 60 * 60 * 1000;

    this.overallColumns = Math.ceil(this.overallDuration / this.columnDuration);

    this.columnWidth = Math.ceil(this.canvasWidth / this.overallColumns);
  }

  initializeBars() {
    this.bars = [];

    let currentRow = 0;

    for (let { title, start, end, id } of this.milestones) {
      const x = this.scaleX(start);
      const y =
        DEFAULT_FONT_SIZE +
        currentRow++ * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2) +
        DEFAULT_ROW_PADDING;

      const width = this.scaleX(end) - x;
      const height = DEFAULT_ROW_HEIGHT;

      const bar = { x, y, width, height, id, title };
      this.bars.push(bar);
    }
  }

  initializeEventHandlers() {
    this.selectedBar = null;
    this.selectedSlider = null;
    this.isMouseDragging = false;
    this.initialMousePosition = { x: 0, y: 0 };
    this.initialBar = null;
  }

  barToEventDetail({ x, width, title, id }) {
    return {
      start: new Date(this.scaleDate(x)),
      end: new Date(this.scaleDate(x + width)),
      title,
      id
    };
  }

  addEventHandlers() {
    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
  }

  onMouseDown(evt) {
    const { layerX, layerY } = evt;
    const { offsetLeft, offsetTop } = this.canvas;

    const mouseX = (layerX - offsetLeft) * SCALE_FACTOR;
    const mouseY = (layerY - offsetTop) * SCALE_FACTOR;

    this.initialMousePosition = {
      x: mouseX,
      y: mouseY
    };

    if (this.selectedBar) {
      this.initialBar = { ...this.selectedBar };
    }

    this.isMouseDragging = true;
  }

  onMouseUp() {
    this.initialMousePosition = {
      x: 0,
      y: 0
    };

    if (this.selectedBar) {
      const from = this.barToEventDetail(this.initialBar);
      const to = this.barToEventDetail(this.selectedBar);

      if (this.selectedSlider) {
        this.dispatchEvent(new CustomEvent(EVENT_TYPE.MILESTONE_RESIZED, { detail: { from, to } }));
      } else {
        this.dispatchEvent(new CustomEvent(EVENT_TYPE.MILESTONE_MOVED, { detail: { from, to } }));
      }

      {
        const milestone = this.milestones.find(({ id }) => id === this.selectedBar.id);

        milestone.start = new Date(this.scaleDate(this.selectedBar.x));
        milestone.end = new Date(this.scaleDate(this.selectedBar.x + this.selectedBar.width));

        this.initializeBars();
      }

      this.selectedBar = null;
      this.selectedSlider = null;
      this.initialBar = null;

      this.render();
    }

    this.isMouseDragging = false;
  }

  onMouseMove(evt) {
    const { layerX, layerY } = evt;
    const { offsetLeft, offsetTop } = this.canvas;

    const mouseX = (layerX - offsetLeft) * SCALE_FACTOR;
    const mouseY = (layerY - offsetTop) * SCALE_FACTOR;

    const deltaX = mouseX - this.initialMousePosition.x;

    let needsRendering = false;

    if (this.isMouseDragging && !this.selectedBar) {
      const deltaTime = this.scaleDate(deltaX) - this.minStart.getTime();

      this.minStart = addMilliseconds(this.minStart, -deltaTime);
      this.maxEnd = addMilliseconds(this.maxEnd, -deltaTime);

      this.initializeColumns();
      this.initializeBars();

      this.initialMousePosition = { x: mouseX, y: mouseY };

      this.render();

      return;
    }

    let selectedBarFound = null;

    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];

      const {
        x: barX,
        y: barY,
        width: barWidth,
        height: barHeight,
        isSelected: wasSelected,
        leftSliderSelected: wasLeftSliderSelected,
        rightSliderSelected: wasRightSliderSelected
      } = bar;

      bar.isSelected = false;
      bar.rightSliderSelected = false;
      bar.leftSliderSelected = false;

      if (!this.isMouseDragging) {
        if (
          mouseX > barX + SLIDER_WIDTH / 2 &&
          mouseX < barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bar.isSelected = true;
          selectedBarFound = bar;
        }

        if (
          mouseX >= barX - SLIDER_WIDTH / 2 &&
          mouseX <= barX + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bar.leftSliderSelected = true;
          selectedBarFound = bar;
          this.selectedSlider = LEFT_SLIDER;
        } else if (
          mouseX >= barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseX <= barX + barWidth + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bar.rightSliderSelected = true;
          selectedBarFound = bar;
          this.selectedSlider = RIGHT_SLIDER;
        } else if (this.selectedBar === bar) {
          this.selectedSlider = null;
        }
      }

      if (
        bar.isSelected !== wasSelected ||
        bar.leftSliderSelected !== wasLeftSliderSelected ||
        bar.rightSliderSelected !== wasRightSliderSelected
      ) {
        needsRendering = true;
      }
    }

    if (!this.isMouseDragging) {
      this.selectedBar = selectedBarFound;
    }

    if (this.isMouseDragging) {
      // drag the whole bar
      if (!this.selectedSlider) {
        // for now only allow horizontal drags
        this.selectedBar.x += deltaX;
      } else if (this.selectedSlider === LEFT_SLIDER) {
        this.selectedBar.x += deltaX;
        this.selectedBar.width -= deltaX;
      } else if (this.selectedSlider === RIGHT_SLIDER) {
        this.selectedBar.width += deltaX;
      }

      needsRendering = true;

      this.initialMousePosition = { x: mouseX, y: mouseY };
    }

    if (needsRendering) {
      this.render();
    }
  }

  drawColumn(index) {
    if (index % 2 === 0) {
      this.ctx.fillStyle = COLORS.scale.bar.even;
    } else {
      this.ctx.fillStyle = COLORS.scale.bar.odd;
    }

    this.ctx.fillRect(index * this.columnWidth, 0, this.columnWidth, this.canvasHeight);

    const headerHeight = FONTS.scale.column.title.size * 1.5;

    this.ctx.fillStyle = COLORS.scale.header.background;
    this.ctx.fillRect(index * this.columnWidth, 0, this.columnWidth, headerHeight);

    this.ctx.lineWidth = HEADER_BORDER_WIDTH;
    this.ctx.strokeStyle = COLORS.scale.header.border;

    this.ctx.beginPath();
    this.ctx.moveTo(index * this.columnWidth, 0);
    this.ctx.lineTo(index * this.columnWidth, headerHeight);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(index * this.columnWidth, headerHeight);
    this.ctx.lineTo((index + 1) * this.columnWidth, headerHeight);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo((index + 1) * this.columnWidth, headerHeight);
    this.ctx.lineTo((index + 1) * this.columnWidth, 0);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.fillStyle = FONTS.scale.column.title.color;
    this.ctx.font = `${FONTS.scale.column.title.size}px ${FONTS.scale.column.title.font}`;

    const columnDate = addMilliseconds(this.minStart, index * this.columnDuration);

    const columnLabel = formatDate(columnDate, "dd/MM/yy");

    const labelWidth = this.ctx.measureText(columnLabel).width;

    this.ctx.fillText(columnLabel, (index * this.columnWidth) + ((this.columnWidth - labelWidth) / 2), DEFAULT_FONT_SIZE);
  }

  drawSlider({ x, y, height, isEven, isDragging }) {
    if (isDragging) {
      if (isEven) {
        this.ctx.fillStyle = COLORS.milestone.slider.even.dragging;
      } else {
        this.ctx.fillStyle = COLORS.milestone.slider.odd.dragging;
      }
    } else {
      if (isEven) {
        this.ctx.fillStyle = COLORS.milestone.slider.even.highlighted;
      } else {
        this.ctx.fillStyle = COLORS.milestone.slider.odd.highlighted;
      }
    }

    roundRect(
      this.ctx,
      x - SLIDER_WIDTH / 2,
      y - SLIDER_WIDTH / 5,
      SLIDER_WIDTH,
      height + (SLIDER_WIDTH / 5) * 2,
      DEFAULT_RADIUS,
      true,
      false
    );

    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = COLORS.milestone.slider.symbol;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + SLIDER_WIDTH);
    this.ctx.lineTo(x, y + height - SLIDER_WIDTH);
    this.ctx.closePath();
    this.ctx.stroke();
  }

  drawMilestoneBar({ x, y, width, height, title, isSelected, isEven, isDragging }) {
    if (isDragging) {
      this.ctx.fillStyle = isEven
        ? COLORS.milestone.bar.even.dragging
        : COLORS.milestone.bar.odd.dragging;

      this.ctx.strokeStyle = isEven
        ? COLORS.milestone.bar.even.draggingBorder
        : COLORS.milestone.bar.odd.draggingBorder;
    } else {
      if (isEven) {
        this.ctx.fillStyle = isSelected
          ? COLORS.milestone.bar.even.highlighted
          : COLORS.milestone.bar.even.default;
      } else {
        this.ctx.fillStyle = isSelected
          ? COLORS.milestone.bar.odd.highlighted
          : COLORS.milestone.bar.odd.default;
      }

      this.ctx.strokeStyle = '';
    }

    roundRect(this.ctx, x, y, width, height, DEFAULT_RADIUS, true, isDragging);

    this.ctx.fillStyle = FONTS.milestone.label.color;
    this.ctx.font = `${FONTS.milestone.label.size}px ${FONTS.milestone.label.font}`;

    const labelWidth = this.ctx.measureText(title).width;
    this.ctx.fillText(title, (x + width / 2) - (labelWidth / 2), y + DEFAULT_FONT_SIZE / 2 + height / 2);
  }

  drawMilestone(bar, isEven) {
    const {
      x,
      y,
      width,
      height,
      title,
      isSelected,
      leftSliderSelected,
      rightSliderSelected
    } = bar;

    if (!this.isMouseDragging || this.selectedBar !== bar) {
      this.drawMilestoneBar({ x, y, width, height, title, isSelected: isSelected || leftSliderSelected || rightSliderSelected, isEven, isDragging: false });

      if (leftSliderSelected) {
        this.drawSlider({ x, y, height, isEven, isDragging: false });
      } else if (rightSliderSelected) {
        this.drawSlider({ x: x + width, y, height, isEven, isDragging: false });
      }
    } else if (this.isMouseDragging && this.selectedBar === bar) {
      this.drawMilestoneBar({ x, y, width, height, title, isSelected, isEven, isDragging: true });

      if (!this.selectedSlider) {
        this.drawMilestoneBar({ x, y, width, height, title, isSelected, isEven, isDragging: true });
      } else if (this.selectedSlider === LEFT_SLIDER) {
        this.drawSlider({ x, y, height, isEven, isDragging: true });
      } else if (this.selectedSlider === RIGHT_SLIDER) {
        this.drawSlider({ x: x + width, y, height, isEven, isDragging: true });
      }
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // draw background columns
    for (let i = 0; i < this.overallColumns; i++) {
      this.drawColumn(i);
    }

    // draw bars
    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];

      this.drawMilestone(bar, i % 2 === 0);
    }

    // draw today's marker line
    {
      const x = this.scaleX(new Date());

      this.ctx.strokeStyle = COLORS.scale.marker.today;
      this.ctx.lineWidth = TODAY_MARKER_WIDTH;

      this.ctx.beginPath();
      this.ctx.moveTo(x, DEFAULT_FONT_SIZE);
      this.ctx.lineTo(x, this.canvasHeight);
      this.ctx.stroke();
    }
  }

  /**
   * Converts a date to a point on a chart
   *
   * @param {Date} date date to convert
   * @returns {number} point (horizontal axis, x) on a chart on a scale
   *
   * linear interpolation of a point (x, y) between two known points (x0, y0) and (x1, y1):
   *
   * y = y0 + (x - x0) * ((y1 - y0) / (x1 - x0))
   *
   * in our case, x0 would be the minStart and x1 would be the maxEnd
   * whilst y0 would be 0 and y1 would be canvasWidth
   *
   * and for any given point `date` (x) we are looking for corresponding x coordinate on canvas (y)
   *
   * so the equation is
   *
   * result = 0 + (date - minStart) * ((canvasWidth - 0) / (maxEnd - minStart))
   *
   * and since we know the (maxEnd - minStart) as overallDuration,
   *
   * result = (date - minStart) * (canvasWidth / overallDuration)
   */
  scaleX(date) {
    return Math.ceil((date.getTime() - this.minStart) * (this.canvasWidth / this.overallDuration));
  }

  /**
   * Converts a position on a chart to a Date (timestamp, in fact).
   *
   * @param {number} x the point on a chart
   * @returns {number} time, in millis, the corresponding date on a scale
   *
   * inverse to {@link scaleX} linear interpolation
   *
   * y = y0 + (x - x0) * ((y1 - y0) / (x1 - x0))
   *
   * x0 = 0
   * y0 = minStart
   *
   * x1 = canvasWidth
   * y1 = maxEnd
   *
   * y = minStart + (x - 0) * ((maxEnd - minStart) / (canvasWidth - 0))
   *
   * y = minStart + (x * (overallDuration / canvasWidth))
   *
   */
  scaleDate(x) {
    return Math.ceil(this.minStart.getTime() + (x * (this.overallDuration / this.canvasWidth)));
  }
}

export const createGanttChart = (parentElt, milestones) => {
  const chart = new GanttChart(parentElt, milestones);

  chart.render();
};
