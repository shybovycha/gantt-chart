import {
  addMilliseconds,
  getDayOfYear,
  startOfDay,
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
const CONNECTION_OFFSET = 10 * SCALE_FACTOR;
const CONNECTION_ARROW_WIDTH = (CONNECTION_OFFSET / 2);
const CONNECTION_ARROW_HEIGHT = (CONNECTION_OFFSET / 3);
const CONNECTION_LINE_WIDTH = 2;

const MIN_COLUMN_WIDTH = 40 * SCALE_FACTOR;

const COLORS = {
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

const HEADER_HEIGHT = FONTS.scale.column.title.size * 1.5;

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

    this.milestones = new Map(milestones.map(milestone => [ milestone.id, milestone ]));

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
      HEADER_HEIGHT + (this.milestones.size * (DEFAULT_ROW_HEIGHT + (DEFAULT_ROW_PADDING * 2)));

    this.canvas.style.width = `${this.canvasWidth / SCALE_FACTOR}px`;
    this.canvas.style.height = `${this.canvasHeight / SCALE_FACTOR}px`;

    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    this.ctx = this.canvas.getContext("2d");
  }

  initializeScale() {
    // create header / scale
    // find the shortest and the longest milestones
    const dates = Array.from(this.milestones.values()).flatMap(({ start, end }) => [ start, end ]);

    this.minStart = minDate(dates);
    this.maxEnd = maxDate(dates);

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

    for (let { title, start, end, id, ...rest } of this.milestones.values()) {
      const x = this.scaleX(start);
      const y =
        HEADER_HEIGHT +
        currentRow++ * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2) +
        DEFAULT_ROW_PADDING;

      const width = this.scaleX(end) - x;
      const height = DEFAULT_ROW_HEIGHT;

      const bar = { x, y, width, height, title, id, ...rest };
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

  /**
   * Zooms in or out, depending on {@param factor}.
   *
   * @param {number} factor zooming factor
   */
  zoom(factor) {
    if (factor < 1 && this.columnWidth <= MIN_COLUMN_WIDTH) {
      console.error("Can not zoom out further");
      return;
    }

    const originalDuration = this.overallDuration;

    this.columnWidth = Math.floor(this.columnWidth * factor);
    this.overallColumns = Math.ceil(this.canvasWidth / this.columnWidth);
    this.overallDuration = this.columnDuration * this.overallColumns;

    const durationDiff = this.overallDuration - originalDuration;

    this.minStart = addMilliseconds(this.minStart, durationDiff / -2);
    this.maxEnd = addMilliseconds(this.minStart, durationDiff / 2);

    this.initializeBars();

    this.render();
  }

  barToEventDetail({ x, width, id }) {
    return {
      ...this.milestones.get(id),
      start: new Date(this.scaleDate(x)),
      end: new Date(this.scaleDate(x + width)),
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

      if (this.initialBar.x !== this.selectedBar.x || this.initialBar.width != this.selectedBar.width) {
        if (this.selectedSlider) {
          this.dispatchEvent(new CustomEvent(EVENT_TYPE.MILESTONE_RESIZED, { detail: { from, to } }));
        } else {
          this.dispatchEvent(new CustomEvent(EVENT_TYPE.MILESTONE_MOVED, { detail: { from, to } }));
        }
      }

      {
        const milestone = this.milestones.get(this.selectedBar.id);

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

      this.initializeBars();

      this.initialMousePosition = { x: mouseX, y: mouseY };

      if (this.canvas.style.cursor != "move") {
        this.canvas.style.cursor = "move";
      }

      this.render();

      return;
    }

    let selectedBarFound = null;
    this.canvas.style.cursor = "auto";

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
          this.canvas.style.cursor = "grab";
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
          this.canvas.style.cursor = "col-resize";
        } else if (
          mouseX >= barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseX <= barX + barWidth + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bar.rightSliderSelected = true;
          selectedBarFound = bar;
          this.selectedSlider = RIGHT_SLIDER;
          this.canvas.style.cursor = "col-resize";
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
      if (this.selectedBar && !this.selectedSlider) {
        // drag the whole bar
        // for now only allow horizontal drags
        this.selectedBar.x += deltaX;
        this.canvas.style.cursor = "grabbing";
      } else if (this.selectedSlider === LEFT_SLIDER) {
        this.selectedBar.x += deltaX;
        this.selectedBar.width -= deltaX;
        this.canvas.style.cursor = "col-resize";
      } else if (this.selectedSlider === RIGHT_SLIDER) {
        this.selectedBar.width += deltaX;
        this.canvas.style.cursor = "col-resize";
      }

      needsRendering = true;

      this.initialMousePosition = { x: mouseX, y: mouseY };
    }

    if (needsRendering) {
      this.render();
    }
  }

  drawColumn(index) {
    const columnDate = addMilliseconds(startOfDay(this.minStart), index * this.columnDuration);

    if (getDayOfYear(columnDate) % 2 === 0) {
      this.ctx.fillStyle = COLORS.scale.bar.even;
    } else {
      this.ctx.fillStyle = COLORS.scale.bar.odd;
    }

    const x = this.scaleX(columnDate);
    const width = this.columnWidth;

    this.ctx.fillRect(x, 0, this.columnWidth, this.canvasHeight);

    this.ctx.fillStyle = COLORS.scale.header.background;
    this.ctx.fillRect(x, 0, this.columnWidth, HEADER_HEIGHT);

    this.ctx.lineWidth = HEADER_BORDER_WIDTH;
    this.ctx.strokeStyle = COLORS.scale.header.border;

    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, HEADER_HEIGHT);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x, HEADER_HEIGHT);
    this.ctx.lineTo(x + width, HEADER_HEIGHT);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(x + width, HEADER_HEIGHT);
    this.ctx.lineTo(x + width, 0);
    this.ctx.closePath();
    this.ctx.stroke();

    this.ctx.fillStyle = FONTS.scale.column.title.color;
    this.ctx.font = `${FONTS.scale.column.title.size}px ${FONTS.scale.column.title.font}`;

    const columnLabel = formatDate(columnDate, "dd/MM/yy");

    const labelWidth = this.ctx.measureText(columnLabel).width;

    this.ctx.fillText(columnLabel, x + ((this.columnWidth - labelWidth) / 2), DEFAULT_FONT_SIZE);
  }

  drawSlider({ x, y, height, isEven, isDragging }) {
    if (isDragging) {
      if (isEven) {
        this.ctx.fillStyle = COLORS.milestone.bar.even.draggingSlider;
      } else {
        this.ctx.fillStyle = COLORS.milestone.bar.odd.draggingSlider;
      }
    } else {
      if (isEven) {
        this.ctx.fillStyle = COLORS.milestone.bar.even.highlightedSlider;
      } else {
        this.ctx.fillStyle = COLORS.milestone.bar.odd.highlightedSlider;
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

  drawMilestoneBar({ x, y, width, height, title, completed, isSelected, isEven, isDragging }) {
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

    // milestone itself
    roundRect(this.ctx, x, y, width, height, DEFAULT_RADIUS, true, isDragging);

    // milestone progress
    if (completed > 0) {
      this.ctx.fillStyle = isEven
        ? COLORS.milestone.bar.even.progress
        : COLORS.milestone.bar.odd.progress;

      roundRect(this.ctx, x, y, width * completed, height, DEFAULT_RADIUS, true, isDragging);
    }

    this.ctx.fillStyle = FONTS.milestone.label.color;
    this.ctx.font = `${FONTS.milestone.label.size}px ${FONTS.milestone.label.font}`;

    const labelWidth = this.ctx.measureText(title).width;
    this.ctx.fillText(title, (x + width / 2) - (labelWidth / 2), y + DEFAULT_FONT_SIZE / 2 + height / 2);
  }

  drawDependencyConnections(bar) {
    for (let [ id, connectionType ] of Object.entries(bar.dependencies)) {
      const dependency = this.bars.find(other => other.id === id);

      if (!dependency) {
        // dependency does not exist
        continue;
      }

      if (connectionType === "start-to-start") {
        this.ctx.strokeStyle = COLORS.milestone.connection.startToStart.line;
        this.ctx.fillStyle = COLORS.milestone.connection.startToStart.line;
        this.ctx.lineWidth = CONNECTION_LINE_WIDTH;

        const p0 = [ bar.x, bar.y + bar.height / 2 ];

        const pa = [ Math.min(bar.x, dependency.x) - CONNECTION_OFFSET, bar.y + bar.height / 2 ];
        const pb = [ Math.min(bar.x, dependency.x) - CONNECTION_OFFSET, dependency.y + dependency.height / 2 ];

        const p1 = [ dependency.x, dependency.y + dependency.height / 2 ];

        this.ctx.beginPath();
        this.ctx.moveTo(p0[0], p0[1]);
        this.ctx.lineTo(pa[0] + (CONNECTION_OFFSET / 2), pa[1]);
        this.ctx.quadraticCurveTo(pa[0], pa[1], pa[0], pa[1] + (CONNECTION_OFFSET / 2));
        this.ctx.lineTo(pb[0], pb[1] - (CONNECTION_OFFSET / 2));
        this.ctx.quadraticCurveTo(pb[0], pb[1], pb[0] + (CONNECTION_OFFSET / 2), p1[1]);
        this.ctx.lineTo(p1[0], p1[1]);
        this.ctx.stroke();

        // arrow
        this.ctx.beginPath();
        this.ctx.moveTo(p1[0], p1[1]);
        this.ctx.lineTo(p1[0] - CONNECTION_ARROW_WIDTH, p1[1] - CONNECTION_ARROW_HEIGHT);
        this.ctx.lineTo(p1[0] - CONNECTION_ARROW_WIDTH, p1[1] + CONNECTION_ARROW_HEIGHT);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (connectionType === "end-to-end") {
        this.ctx.strokeStyle = COLORS.milestone.connection.endToEnd.line;
        this.ctx.fillStyle = COLORS.milestone.connection.endToEnd.line;
        this.ctx.lineWidth = CONNECTION_LINE_WIDTH;

        const p0 = [ bar.x + bar.width, bar.y + bar.height / 2 ];

        const pa = [ Math.max(bar.x + bar.width, dependency.x + dependency.width) + CONNECTION_OFFSET, bar.y + bar.height / 2 ];
        const pb = [ pa[0], dependency.y + dependency.height / 2 ];

        const p1 = [ dependency.x + dependency.width, dependency.y + dependency.height / 2 ];

        this.ctx.beginPath();
        this.ctx.moveTo(p0[0], p0[1]);
        this.ctx.lineTo(pa[0] - (CONNECTION_OFFSET / 2), pa[1]);
        this.ctx.quadraticCurveTo(pa[0], pa[1], pa[0], pa[1] + (CONNECTION_OFFSET / 2));
        this.ctx.lineTo(pb[0], pb[1] - (CONNECTION_OFFSET / 2));
        this.ctx.quadraticCurveTo(pb[0], pb[1], pb[0] - (CONNECTION_OFFSET / 2), p1[1]);
        this.ctx.lineTo(p1[0], p1[1]);
        this.ctx.stroke();

        // arrow
        this.ctx.beginPath();
        this.ctx.moveTo(p1[0], p1[1]);
        this.ctx.lineTo(p1[0] + CONNECTION_ARROW_WIDTH, p1[1] - CONNECTION_ARROW_HEIGHT);
        this.ctx.lineTo(p1[0] + CONNECTION_ARROW_WIDTH, p1[1] + CONNECTION_ARROW_HEIGHT);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (connectionType === "end-to-start") {
        this.ctx.strokeStyle = COLORS.milestone.connection.endToStart.line;
        this.ctx.fillStyle = COLORS.milestone.connection.endToStart.line;
        this.ctx.lineWidth = CONNECTION_LINE_WIDTH;

        const p0 = [ bar.x + bar.width, bar.y + bar.height / 2 ];

        const dx = Math.abs(bar.x + bar.width - dependency.x);
        const dy = Math.abs(bar.y + (bar.height / 2) - (dependency.y + (dependency.height / 2)));

        const pa = [ bar.x + bar.width + (dx / 2), bar.y + (bar.height / 2) + (dy / 3) ];
        const pb = [ dependency.x - (dx / 2), dependency.y + (dependency.height / 2) - (dy / 3) ];

        const p1 = [ dependency.x, dependency.y + dependency.height / 2 ];

        this.ctx.beginPath();
        this.ctx.moveTo(p0[0], p0[1]);
        this.ctx.bezierCurveTo(pa[0], pa[1], pb[0], pb[1], p1[0], p1[1]);
        this.ctx.stroke();

        // arrow
        this.ctx.beginPath();
        this.ctx.moveTo(p1[0], p1[1]);
        this.ctx.lineTo(p1[0] - CONNECTION_ARROW_WIDTH, p1[1] - CONNECTION_ARROW_HEIGHT);
        this.ctx.lineTo(p1[0] - CONNECTION_ARROW_WIDTH, p1[1] + CONNECTION_ARROW_HEIGHT);
        this.ctx.closePath();
        this.ctx.fill();
      } else {
        // unknown connection type
      }
    }
  }

  drawMilestone(bar, isEven) {
    const {
      x,
      width,
      isSelected,
      leftSliderSelected,
      rightSliderSelected
    } = bar;

    this.drawDependencyConnections(bar);

    if (!this.isMouseDragging || this.selectedBar !== bar) {
      this.drawMilestoneBar({ ...bar, isSelected: isSelected || leftSliderSelected || rightSliderSelected, isEven, isDragging: false });

      if (leftSliderSelected) {
        this.drawSlider({ ...bar, isEven, isDragging: false });
      } else if (rightSliderSelected) {
        this.drawSlider({ ...bar, x: x + width, isEven, isDragging: false });
      }
    } else if (this.isMouseDragging && this.selectedBar === bar) {
      this.drawMilestoneBar({ ...bar, isEven, isDragging: true });

      if (!this.selectedSlider) {
        this.drawMilestoneBar({ ...bar, isEven, isDragging: true });
      } else if (this.selectedSlider === LEFT_SLIDER) {
        this.drawSlider({ ...bar, isEven, isDragging: true });
      } else if (this.selectedSlider === RIGHT_SLIDER) {
        this.drawSlider({ ...bar, x: x + width, isEven, isDragging: true });
      }
    }
  }

  drawTodayMarker() {
    const x = this.scaleX(new Date());

    const headerHeight = FONTS.scale.column.title.size * 1.5;

    this.ctx.strokeStyle = COLORS.scale.marker.today;
    this.ctx.lineWidth = TODAY_MARKER_WIDTH;

    this.ctx.beginPath();
    this.ctx.moveTo(x, headerHeight);
    this.ctx.lineTo(x, this.canvasHeight);
    this.ctx.stroke();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // draw background columns
    for (let i = 0; i < this.overallColumns + 1; i++) {
      this.drawColumn(i);
    }

    // draw bars
    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];

      this.drawMilestone(bar, i % 2 === 0);
    }

    // draw today's marker line
    this.drawTodayMarker();
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
