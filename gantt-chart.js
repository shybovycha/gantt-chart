import {
  addMilliseconds,
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
      }
    }
  },
  scale: {
    bar: {
      odd: "rgba(255, 255, 255, 0.9)",
      even: "rgba(220, 225, 220, 0.4)"
    },
    marker: {
      today: "rgba(238, 156, 93, 1)"
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

class GanttChart {
  constructor(parentElt, milestones) {
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

    for (let { title, start, end } of this.milestones) {
      const x = this.scaleX(start);
      const y =
        DEFAULT_FONT_SIZE +
        currentRow++ * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2) +
        DEFAULT_ROW_PADDING;

      const width = this.scaleX(end) - x;
      const height = DEFAULT_ROW_HEIGHT;

      const bar = { x, y, width, height, title };
      this.bars.push(bar);
    }
  }

  initializeEventHandlers() {
    this.selectedBar = null;
    this.selectedSlider = null;
    this.isMouseDragging = false;
    this.initialMousePosition = { x: 0, y: 0 };
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
      this.isMouseDragging = true;
    }
  }

  onMouseUp() {
    this.initialMousePosition = {
      x: 0,
      y: 0
    };

    if (this.selectedBar) {
      this.isMouseDragging = false;
      this.selectedBar = null;
      this.selectedSlider = null;

      this.render();
    }
  }

  onMouseMove(evt) {
    const { layerX, layerY } = evt;
    const { offsetLeft, offsetTop } = this.canvas;

    const mouseX = (layerX - offsetLeft) * SCALE_FACTOR;
    const mouseY = (layerY - offsetTop) * SCALE_FACTOR;

    let needsRendering = false;

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
          this.selectedBar = bar;
        }

        if (
          mouseX >= barX - SLIDER_WIDTH / 2 &&
          mouseX <= barX + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bar.leftSliderSelected = true;
          this.selectedBar = bar;
          this.selectedSlider = "left";
        } else if (
          mouseX >= barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseX <= barX + barWidth + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bar.rightSliderSelected = true;
          this.selectedBar = bar;
          this.selectedSlider = "right";
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

    if (this.isMouseDragging) {
      // drag the whole bar
      if (!this.selectedSlider) {
        // for now only allow horizontal drags
        this.selectedBar.x += mouseX - this.initialMousePosition.x;
      } else if (this.selectedSlider === "left") {
        this.selectedBar.x += mouseX - this.initialMousePosition.x;
        this.selectedBar.width -= mouseX - this.initialMousePosition.x;
      } else if (this.selectedSlider === "right") {
        this.selectedBar.width += mouseX - this.initialMousePosition.x;
      }

      needsRendering = true;

      this.initialMousePosition = { x: mouseX, y: mouseY };
    }

    if (needsRendering) {
      this.render();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

    // draw background columns
    for (let i = 0; i < this.overallColumns; i++) {
      if (i % 2 === 0) {
        this.ctx.fillStyle = COLORS.scale.bar.even;
      } else {
        this.ctx.fillStyle = COLORS.scale.bar.odd;
      }

      this.ctx.fillRect(i * this.columnWidth, 0, this.columnWidth, this.canvasHeight);

      this.ctx.fillStyle = FONTS.scale.column.title.color;
      this.ctx.font = `${FONTS.scale.column.title.size}px ${FONTS.scale.column.title.font}`;

      const columnDate = addMilliseconds(this.minStart, i * this.columnDuration);

      const columnLabel = formatDate(columnDate, "dd/MM/yy");

      const labelWidth = this.ctx.measureText(columnLabel).width;

      this.ctx.fillText(columnLabel, (i * this.columnWidth) + ((this.columnWidth - labelWidth) / 2), DEFAULT_FONT_SIZE);
    }

    // draw bars
    for (let i = 0; i < this.bars.length; i++) {
      const bar = this.bars[i];

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
        if (i % 2 === 0) {
          this.ctx.fillStyle = isSelected
            ? COLORS.milestone.bar.even.highlighted
            : COLORS.milestone.bar.even.default;
        } else {
          this.ctx.fillStyle = isSelected
            ? COLORS.milestone.bar.odd.highlighted
            : COLORS.milestone.bar.odd.default;
        }

        roundRect(this.ctx, x, y, width, height, DEFAULT_RADIUS, true, false);

        if (leftSliderSelected) {
          if (i % 2 === 0) {
            this.ctx.fillStyle = COLORS.milestone.slider.even.highlighted;
          } else {
            this.ctx.fillStyle = COLORS.milestone.slider.odd.highlighted;
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
          this.ctx.strokeStyle = "rgba(0, 0, 0, 1.0)";
          this.ctx.beginPath();
          this.ctx.moveTo(x, y + SLIDER_WIDTH);
          this.ctx.lineTo(x, y + height - SLIDER_WIDTH);
          this.ctx.closePath();
          this.ctx.stroke();
        }

        if (rightSliderSelected) {
          if (i % 2 === 0) {
            this.ctx.fillStyle = COLORS.milestone.slider.even.highlighted;
          } else {
            this.ctx.fillStyle = COLORS.milestone.slider.odd.highlighted;
          }

          roundRect(
            this.ctx,
            x + width - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2,
            DEFAULT_RADIUS,
            true,
            false
          );

          this.ctx.lineWidth = 1;
          this.ctx.strokeStyle = "rgba(0, 0, 0, 1.0)";
          this.ctx.beginPath();
          this.ctx.moveTo(x + width, y + SLIDER_WIDTH);
          this.ctx.lineTo(x + width, y + height - SLIDER_WIDTH);
          this.ctx.closePath();
          this.ctx.stroke();
        }

        this.ctx.fillStyle = FONTS.milestone.label.color;
        this.ctx.font = `${FONTS.milestone.label.size}px ${FONTS.milestone.label.font}`;

        const labelWidth = this.ctx.measureText(title).width;
        this.ctx.fillText(title, (x + width / 2) - (labelWidth / 2), y + DEFAULT_FONT_SIZE / 2 + height / 2);
      } else if (this.isMouseDragging && this.selectedBar === bar) {
        if (i % 2 === 0) {
          this.ctx.strokeStyle = COLORS.milestone.bar.even.draggingBorder;
          this.ctx.fillStyle = COLORS.milestone.bar.even.dragging;
        } else {
          this.ctx.strokeStyle = COLORS.milestone.bar.odd.draggingBorder;
          this.ctx.fillStyle = COLORS.milestone.bar.odd.dragging;
        }

        roundRect(this.ctx, x, y, width, height, 5, true, true);

        if (!this.selectedSlider) {
          if (i % 2 === 0) {
            this.ctx.strokeStyle = COLORS.milestone.bar.even.draggingBorder;
          } else {
            this.ctx.strokeStyle = COLORS.milestone.bar.odd.draggingBorder;
          }

          roundRect(this.ctx, x, y, width, height, 5, true, true, 5, true, true);
        } else if (this.selectedSlider === "left") {
          if (i % 2 === 0) {
            this.ctx.fillStyle = COLORS.milestone.slider.even.dragging;
          } else {
            this.ctx.fillStyle = COLORS.milestone.slider.odd.dragging;
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
          this.ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          this.ctx.beginPath();
          this.ctx.moveTo(x, y + SLIDER_WIDTH);
          this.ctx.lineTo(x, y + height - SLIDER_WIDTH);
          this.ctx.closePath();
          this.ctx.stroke();
        } else if (this.selectedSlider === "right") {
          if (i % 2 === 0) {
            this.ctx.fillStyle = COLORS.milestone.slider.even.dragging;
          } else {
            this.ctx.fillStyle = COLORS.milestone.slider.odd.dragging;
          }

          roundRect(
            this.ctx,
            x + width - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2,
            DEFAULT_RADIUS,
            true,
            false
          );

          this.ctx.lineWidth = 1;
          this.ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
          this.ctx.beginPath();
          this.ctx.moveTo(x + width, y + SLIDER_WIDTH);
          this.ctx.lineTo(x + width, y + height - SLIDER_WIDTH);
          this.ctx.closePath();
          this.ctx.stroke();
        }
      }
    }

    // draw today's marker line
    {
      const x = this.scaleX(new Date());

      this.ctx.strokeStyle = COLORS.scale.marker.today;
      this.ctx.beginPath();
      this.ctx.moveTo(x, DEFAULT_FONT_SIZE);
      this.ctx.lineTo(x, this.canvasHeight);
      this.ctx.stroke();
    }
  }

  /*
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
}

export const createGanttChart = (parentElt, milestones) => {
  const chart = new GanttChart(parentElt, milestones);

  chart.render();
};
