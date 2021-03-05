import {
  addMilliseconds,
  format as formatDate,
  min as minDate,
  max as maxDate
} from "date-fns";

export const createGanttChart = (parentElt, milestones) => {
  const canvas = document.createElement("canvas");
  parentElt.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  const SCALE_FACTOR = 2;

  const DEFAULT_ROW_HEIGHT = 40 * SCALE_FACTOR;
  const DEFAULT_WIDTH = 1800 * SCALE_FACTOR;
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

  const fontSize = DEFAULT_FONT_SIZE;

  const canvasWidth = canvas.outerWidth || DEFAULT_WIDTH;
  const canvasHeight =
    canvas.outerHeight ||
    (milestones.length + 1) * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2);

  canvas.style.width = `${canvasWidth / SCALE_FACTOR}px`;
  canvas.style.height = `${canvasHeight / SCALE_FACTOR}px`;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // console.log("canvas", canvasWidth, canvasHeight);

  // create header / scale
  // find the shortest and the longest milestones
  const minStart = minDate(milestones.map(({ start }) => start));
  const maxEnd = maxDate(milestones.map(({ end }) => end));

  const overallDuration = maxEnd.getTime() - minStart.getTime();

  const shortestMilestoneDuration = milestones
    .map(({ start, end }) => end.getTime() - start.getTime())
    .reduce(
      (acc, duration) => (acc < duration ? acc : duration),
      Number.MAX_VALUE
    );

  // shortest milestone should occupy 3 "columns"
  // hence the overall number of "columns" is overallDuration / (shortest / 3)

  const columnDuration = Math.ceil(shortestMilestoneDuration / 3);

  const overallColumns = Math.ceil(overallDuration / columnDuration);

  const columnWidth = Math.ceil(canvasWidth / overallColumns);

  const roundRect = (ctx, x, y, width, height, radius, fill, stroke) => {
    if (typeof stroke === "undefined") {
      stroke = false;
    }

    if (typeof radius === "undefined") {
      radius = 0;
    }

    if (typeof radius === "number") {
      radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
      const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };

      for (let side of defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side];
      }
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + width - radius.tr, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
    ctx.lineTo(x + width, y + height - radius.br);
    ctx.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius.br,
      y + height
    );
    ctx.lineTo(x + radius.bl, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();

    if (fill) {
      ctx.fill();
    }

    if (stroke) {
      ctx.stroke();
    }
  };

  // console.log(
  //   "Columns:",
  //   overallColumns,
  //   "of",
  //   columnWidth,
  //   "px",
  //   columnDuration,
  //   "ms"
  // );

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
  const scaleX = (date) =>
    Math.ceil((date.getTime() - minStart) * (canvasWidth / overallDuration));

  // console.log(
  //   "scaled start",
  //   minStart,
  //   scaleX(minStart),
  //   "scaled end",
  //   maxEnd,
  //   scaleX(maxEnd)
  // );

  const bars = [];

  let currentRow = 0;

  for (let { title, start, end } of milestones) {
    const x = scaleX(start);
    const y =
      fontSize +
      currentRow++ * (DEFAULT_ROW_HEIGHT + DEFAULT_ROW_PADDING * 2) +
      DEFAULT_ROW_PADDING;

    const width = scaleX(end) - x;
    const height = DEFAULT_ROW_HEIGHT;

    bars.push({ x, y, width, height, title });
  }

  let selectedBar = null;
  let selectedSlider = null;
  let isMouseDragging = false;
  let initialMousePosition = { x: 0, y: 0 };

  canvas.addEventListener("mousedown", (e) => {
    const { layerX, layerY } = e;
    const { offsetLeft, offsetTop } = canvas;

    const mouseX = (layerX - offsetLeft) * SCALE_FACTOR;
    const mouseY = (layerY - offsetTop) * SCALE_FACTOR;

    initialMousePosition = {
      x: mouseX,
      y: mouseY
    };

    if (selectedBar) {
      isMouseDragging = true;
      // console.log("Start dragging", selectedBar);
    }
  });

  canvas.addEventListener("mouseup", () => {
    initialMousePosition = {
      x: 0,
      y: 0
    };

    if (selectedBar) {
      isMouseDragging = false;
      selectedBar = null;
      selectedSlider = null;

      render();
      // console.log("Stop dragging");
    }
  });

  // welcome interactions!
  canvas.addEventListener("mousemove", (e) => {
    // console.log('>> ', e.clientX, e.clientY);
    const { layerX, layerY } = e;
    const { offsetLeft, offsetTop } = canvas;

    const mouseX = (layerX - offsetLeft) * SCALE_FACTOR;
    const mouseY = (layerY - offsetTop) * SCALE_FACTOR;

    // console.log("mouse", mouseX, mouseY);

    let needsRendering = false;

    for (let i = 0; i < bars.length; i++) {
      const {
        x: barX,
        y: barY,
        width: barWidth,
        height: barHeight,
        isSelected: wasSelected,
        leftSliderSelected: wasLeftSliderSelected,
        rightSliderSelected: wasRightSliderSelected
      } = bars[i];

      bars[i].isSelected = false;
      bars[i].rightSliderSelected = false;
      bars[i].leftSliderSelected = false;

      if (!isMouseDragging) {
        if (
          mouseX > barX + SLIDER_WIDTH / 2 &&
          mouseX < barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bars[i].isSelected = true;
          selectedBar = bars[i];
        }

        if (
          mouseX >= barX - SLIDER_WIDTH / 2 &&
          mouseX <= barX + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bars[i].leftSliderSelected = true;
          selectedBar = bars[i];
          selectedSlider = "left";
        } else if (
          mouseX >= barX + barWidth - SLIDER_WIDTH / 2 &&
          mouseX <= barX + barWidth + SLIDER_WIDTH / 2 &&
          mouseY >= barY &&
          mouseY <= barY + barHeight
        ) {
          bars[i].rightSliderSelected = true;
          selectedBar = bars[i];
          selectedSlider = "right";
        } else if (selectedBar === bars[i]) {
          selectedSlider = null;
        }
      }

      if (
        bars[i].isSelected !== wasSelected ||
        bars[i].leftSliderSelected !== wasLeftSliderSelected ||
        bars[i].rightSliderSelected !== wasRightSliderSelected
      ) {
        needsRendering = true;
      }
    }

    if (isMouseDragging) {
      // drag the whole bar
      if (!selectedSlider) {
        // for now only allow horizontal drags
        // console.log(
        //   "Dragging bar horizontally by ",
        //   mouseX - initialMousePosition.x
        // );

        selectedBar.x += mouseX - initialMousePosition.x;
      } else if (selectedSlider === "left") {
        // console.log(
        //   "Shrinking and moving bar horizontally by ",
        //   mouseX - initialMousePosition.x
        // );

        selectedBar.x += mouseX - initialMousePosition.x;
        selectedBar.width -= mouseX - initialMousePosition.x;
      } else if (selectedSlider === "right") {
        // console.log(
        //   "Expanding bar horizontally by ",
        //   mouseX - initialMousePosition.x
        // );

        selectedBar.width += mouseX - initialMousePosition.x;
      }

      // TODO: can add debouncing here
      needsRendering = true;

      initialMousePosition = { x: mouseX, y: mouseY };
    }

    if (needsRendering) {
      render();
    }
  });

  const render = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // draw background columns
    for (let i = 0; i < overallColumns; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = COLORS.scale.bar.even;
      } else {
        ctx.fillStyle = COLORS.scale.bar.odd;
      }

      // TODO make columns aligned to day/hour/minute
      ctx.fillRect(i * columnWidth, 0, columnWidth, canvasHeight);

      ctx.fillStyle = FONTS.scale.column.title.color; // "black";
      ctx.font = `${FONTS.scale.column.title.size}px ${FONTS.scale.column.title.font}`; // `${fontSize}px Arial`;

      const columnDate = addMilliseconds(minStart, i * columnDuration);

      const columnLabel = formatDate(columnDate, "dd/MM/yy hh:mm");

      ctx.fillText(columnLabel, i * columnWidth, fontSize);
    }

    // draw bars
    for (let i = 0; i < bars.length; i++) {
      const bar = bars[i];

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

      // console.log("Drawing rect at ", x, y, width, height, title, start, end);

      if (!isMouseDragging || selectedBar !== bar) {
        if (i % 2 === 0) {
          ctx.fillStyle = isSelected
            ? COLORS.milestone.bar.even.highlighted
            : COLORS.milestone.bar.even.default;
        } else {
          ctx.fillStyle = isSelected
            ? COLORS.milestone.bar.odd.highlighted
            : COLORS.milestone.bar.odd.default;
        }

        // ctx.fillRect(x, y, width, height);
        roundRect(ctx, x, y, width, height, DEFAULT_RADIUS, true, false);

        if (leftSliderSelected) {
          if (i % 2 === 0) {
            ctx.fillStyle = COLORS.milestone.slider.even.highlighted; // "rgba(200, 100, 25, 1.0)";
          } else {
            ctx.fillStyle = COLORS.milestone.slider.odd.highlighted; // "rgba(200, 100, 25, 1.0)";
          }

          // ctx.fillRect(
          //   x - SLIDER_WIDTH / 2,
          //   y - SLIDER_WIDTH / 5,
          //   SLIDER_WIDTH,
          //   height + (SLIDER_WIDTH / 5) * 2
          // );

          roundRect(
            ctx,
            x - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2,
            DEFAULT_RADIUS,
            true,
            false
          );

          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(0, 0, 0, 1.0)";
          ctx.beginPath();
          ctx.moveTo(x, y + SLIDER_WIDTH);
          ctx.lineTo(x, y + height - SLIDER_WIDTH);
          ctx.closePath();
          ctx.stroke();
        }

        if (rightSliderSelected) {
          if (i % 2 === 0) {
            ctx.fillStyle = COLORS.milestone.slider.even.highlighted; // "rgba(200, 100, 25, 1.0)";
          } else {
            ctx.fillStyle = COLORS.milestone.slider.odd.highlighted; // "rgba(200, 100, 25, 1.0)";
          }

          // ctx.fillRect(
          //   x + width - SLIDER_WIDTH / 2,
          //   y - SLIDER_WIDTH / 5,
          //   SLIDER_WIDTH,
          //   height + (SLIDER_WIDTH / 5) * 2
          // );

          roundRect(
            ctx,
            x + width - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2,
            DEFAULT_RADIUS,
            true,
            false
          );

          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(0, 0, 0, 1.0)";
          ctx.beginPath();
          ctx.moveTo(x + width, y + SLIDER_WIDTH);
          ctx.lineTo(x + width, y + height - SLIDER_WIDTH);
          ctx.closePath();
          ctx.stroke();
        }

        // TODO count for label' width
        ctx.fillStyle = FONTS.milestone.label.color; // "black";
        ctx.font = `${FONTS.milestone.label.size}px ${FONTS.milestone.label.font}`;

        // console.log("bar", title, x + width / 2, y + fontSize / 2 + height / 2);

        ctx.fillText(title, x + width / 2, y + fontSize / 2 + height / 2);
      } else if (isMouseDragging && selectedBar === bar) {
        if (i % 2 === 0) {
          ctx.strokeStyle = COLORS.milestone.bar.even.draggingBorder;
          ctx.fillStyle = COLORS.milestone.bar.even.dragging; // "rgba(200, 10, 25, 0.8)";
        } else {
          ctx.strokeStyle = COLORS.milestone.bar.odd.draggingBorder;
          ctx.fillStyle = COLORS.milestone.bar.odd.dragging; // "rgba(200, 10, 25, 0.8)";
        }

        // ctx.fillRect(x, y, width, height);
        roundRect(ctx, x, y, width, height, 5, true, true);

        if (!selectedSlider) {
          if (i % 2 === 0) {
            ctx.strokeStyle = COLORS.milestone.bar.even.draggingBorder;
          } else {
            ctx.strokeStyle = COLORS.milestone.bar.odd.draggingBorder;
          }

          // ctx.strokeRect(x, y, width, height);
          roundRect(ctx, x, y, width, height, 5, true, true, 5, true, true);
        } else if (selectedSlider === "left") {
          if (i % 2 === 0) {
            ctx.fillStyle = COLORS.milestone.slider.even.dragging; // "rgba(150, 50, 25, 1.0)";
          } else {
            ctx.fillStyle = COLORS.milestone.slider.odd.dragging; // "rgba(150, 50, 25, 1.0)";
          }

          // ctx.fillRect(
          //   x - SLIDER_WIDTH / 2,
          //   y - SLIDER_WIDTH / 5,
          //   SLIDER_WIDTH,
          //   height + (SLIDER_WIDTH / 5) * 2
          // );
          roundRect(
            ctx,
            x - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2,
            DEFAULT_RADIUS,
            true,
            false
          );

          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
          ctx.beginPath();
          ctx.moveTo(x, y + SLIDER_WIDTH);
          ctx.lineTo(x, y + height - SLIDER_WIDTH);
          ctx.closePath();
          ctx.stroke();
        } else if (selectedSlider === "right") {
          if (i % 2 === 0) {
            ctx.fillStyle = COLORS.milestone.slider.even.dragging; // "rgba(150, 50, 25, 0.8)";
          } else {
            ctx.fillStyle = COLORS.milestone.slider.odd.dragging; // "rgba(150, 50, 25, 0.8)";
          }

          // ctx.fillRect(
          //   x + width - SLIDER_WIDTH / 2,
          //   y - SLIDER_WIDTH / 5,
          //   SLIDER_WIDTH,
          //   height + (SLIDER_WIDTH / 5) * 2
          // );

          roundRect(
            ctx,
            x + width - SLIDER_WIDTH / 2,
            y - SLIDER_WIDTH / 5,
            SLIDER_WIDTH,
            height + (SLIDER_WIDTH / 5) * 2,
            DEFAULT_RADIUS,
            true,
            false
          );

          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
          ctx.beginPath();
          ctx.moveTo(x + width, y + SLIDER_WIDTH);
          ctx.lineTo(x + width, y + height - SLIDER_WIDTH);
          ctx.closePath();
          ctx.stroke();
        }
      }
    }

    // draw today's marker line
    {
      const x = scaleX(new Date());

      // console.log("today", x);

      ctx.strokeStyle = COLORS.scale.marker.today;
      ctx.beginPath();
      ctx.moveTo(x, fontSize);
      ctx.lineTo(x, canvasHeight);
      ctx.stroke();
    }
  };

  render();
};
