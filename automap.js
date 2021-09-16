function Map(options) {
  this.canvas = $("#canvas")[0];
  this.ctx = this.canvas.getContext("2d");
  this.ctx.imageSmoothingEnabled = false;
  this.canvas.style.backgroundColor = "#9999ff";
  this.canvas.width = 768;
  this.canvas.height = 512;
  this.roomSize = { width: 128, height: 92 };
  this.cameraOffset = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
  this.cameraZoom = 1.5;
  this.MAX_ZOOM = 3;
  this.MIN_ZOOM = 0.5;
  this.SCROLL_SENSITIVITY = 0.0005;
  this.spanContainer = { x: 162, y: 126 };
  this.isDragging = false;
  this.dragStart = { x: 0, y: 0 };
  this.rooms = this.getRooms();
  this.initialPinchDistance = null;
  this.lastZoom = this.cameraZoom;
  this.canvas.addEventListener("mousedown", this.onPointerDown.bind(this));
  this.canvas.addEventListener("touchstart", (event) =>
    this.handleTouch(event, this.onPointerDown.bind(this))
  );

  this.canvas.addEventListener("mouseup", this.onPointerUp.bind(this));
  this.canvas.addEventListener("touchend", (event) =>
    this.handleTouch(event, this.onPointerUp.bind(this))
  );
  this.canvas.addEventListener("mousemove", this.onPointerMove.bind(this));
  this.canvas.addEventListener("touchmove", (event) =>
    this.handleTouch(event, this.onPointerMove.bind(this))
  );
  this.canvas.addEventListener("wheel", (event) =>
    this.adjustZoom(event.deltaY * this.SCROLL_SENSITIVITY)
  );
  this.initRooms();
}

Map.prototype.initRooms = function () {
  for (let room in this.rooms) {
    this.rooms[room].pos = { x: 0, y: 0 };
    this.rooms[room].visited = 0;
  }
};

Map.prototype.draw = function (delta) {
  this.ctx = this.canvas.getContext("2d");
  this.canvas.width = 768;
  this.canvas.height = 512;

  this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
  this.ctx.scale(this.cameraZoom, this.cameraZoom);
  this.ctx.translate(
    -this.canvas.width / 2 + this.cameraOffset.x,
    -this.canvas.height / 2 + this.cameraOffset.y
  );
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

  this.ctx.fillStyle = "#000";
  this.ctx.strokeStyle = "#000";

  for (let room in this.rooms) {
    let _room = this.rooms[room];

    if (_room.tags.filter((e) => e === "start").length > 0) {
      _room.pos = { x: 0, y: 0 };
      _room.visited = 1;
    }

    if (_room.visited > 0) {
      if (_room.name === this.rooms[hero_location().name]) {
        this.drawText(
          `You're here`,
          _room.pos.x - this.roomSize.width / 2 + this.roomSize.width / 2,
          _room.pos.y -
            this.roomSize.height / 2 +
            this.roomSize.height / 2 +
            24,
          12,
          "#444"
        );
      }

      for (let dir in _room.directions) {
        this.drawArrow(this.ctx, _room.pos.x, _room.pos.y, 16, dir);
      }

      this.drawText(
        `${_room.name.replace(/_/g, " ").toUpperCase()}`,
        _room.pos.x - this.roomSize.width / 2 + this.roomSize.width / 2,
        _room.pos.y - this.roomSize.height / 2 + this.roomSize.height / 2
      );
      this.drawText(
        `${_room.tags.length > 0 ? `(${_room.tags[0]})` : ""}`,
        _room.pos.x - this.roomSize.width / 2 + this.roomSize.width / 2,
        _room.pos.y - this.roomSize.height / 2 + this.roomSize.height / 2 + 12,
        12
      );
      this.ctx.save();
      this.ctx.globalAlpha = Math.sin(delta / 128) * 0.1;
      this.drawText(
        `${_room.name === hero_location().name ? `You're here` : ``}`,
        _room.pos.x - this.roomSize.width / 2 + this.roomSize.width / 2,
        _room.pos.y - this.roomSize.height / 2 + this.roomSize.height / 2 - 32,
        12,
        "#444"
      );
      this.ctx.restore();
      this.drawRect(
        _room.pos.x - this.roomSize.width / 2,
        _room.pos.y - this.roomSize.height / 2
      );
    } else {
      this.drawRectDashed(
        _room.pos.x - this.roomSize.width / 2,
        _room.pos.y - this.roomSize.height / 2
      );
    }

    this.distributeRooms(_room.directions, _room);
  }

  requestAnimationFrame(this.draw.bind(this));
};

Map.prototype.distributeRooms = function (directions, activeRoom) {
  for (let dir in directions) {
    let roomName = directions[dir];
    let span = activeRoom.pos;

    if (activeRoom.name === roomName) {
      return;
    }

    switch (dir) {
      case "south":
        this.rooms[directions[dir]].pos = {
          x: span.x,
          y: this.spanContainer.y + span.y,
        };
        break;
      case "north":
        this.rooms[directions[dir]].pos = {
          x: span.x,
          y: -this.spanContainer.y + span.y,
        };
        break;
      case "east":
        this.rooms[directions[dir]].pos = {
          x: this.spanContainer.x + span.x,
          y: span.y,
        };
        break;
      case "west":
        this.rooms[directions[dir]].pos = {
          x: -this.spanContainer.x + span.x,
          y: span.y,
        };
        break;
      case "northeast":
        this.rooms[directions[dir]].pos = {
          x: this.spanContainer.x + span.x,
          y: -this.spanContainer.y + span.y,
        };
        break;
      case "southeast":
        this.rooms[directions[dir]].pos = {
          x: this.spanContainer.x + span.x,
          y: this.spanContainer.y + span.y,
        };
        break;
      case "northwest":
        this.rooms[directions[dir]].pos = {
          x: -this.spanContainer.x + span.x,
          y: -this.spanContainer.y + span.y,
        };
        break;
      case "southwest":
        this.rooms[directions[dir]].pos = {
          x: -this.spanContainer.x + span.x,
          y: this.spanContainer.y + span.y,
        };
        break;
    }
  }
};

Map.prototype.adjustZoom = function (zoomAmount, zoomFactor) {
  if (!this.isDragging) {
    if (zoomAmount) {
      this.cameraZoom += zoomAmount;
    } else if (zoomFactor) {
      this.cameraZoom = zoomFactor * this.lastZoom;
    }

    this.cameraZoom = Math.min(this.cameraZoom, this.MAX_ZOOM);
    this.cameraZoom = Math.max(this.cameraZoom, this.MIN_ZOOM);
  }
};

Map.prototype.onPointerDown = function (event) {
  this.isDragging = true;
  this.dragStart.x =
    this.getEventLocation(event).x / this.cameraZoom - this.cameraOffset.x;
  this.dragStart.y =
    this.getEventLocation(event).y / this.cameraZoom - this.cameraOffset.y;
};

Map.prototype.onPointerUp = function () {
  this.isDragging = false;
  this.initialPinchDistance = null;
  this.lastZoom = this.cameraZoom;
};

Map.prototype.onPointerMove = function (event) {
  if (this.isDragging) {
    this.cameraOffset.x =
      this.getEventLocation(event).x / this.cameraZoom - this.dragStart.x;
    this.cameraOffset.y =
      this.getEventLocation(event).y / this.cameraZoom - this.dragStart.y;
  }
};

Map.prototype.handleTouch = function (event, singleTouchHandler) {
  if (event.touches.length == 1) {
    singleTouchHandler(event);
  } else if (event.type == "touchmove" && event.touches.length == 2) {
    this.isDragging = false;
    this.handlePinch(event);
  }
};

Map.prototype.handlePinch = function (event) {
  event.preventDefault();

  let touch1 = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  let touch2 = { x: event.touches[1].clientX, y: event.touches[1].clientY };

  let currentDistance = (touch1.x - touch2.x) ** 2 + (touch1.y - touch2.y) ** 2;

  if (this.initialPinchDistance == null) {
    this.initialPinchDistance = currentDistance;
  } else {
    this.adjustZoom(null, currentDistance / this.initialPinchDistance);
  }
};

Map.prototype.getEventLocation = function (event) {
  if (event.touches && event.touches.length == 1) {
    return { x: event.touches[0].clientX, y: event.touches[0].clientY };
  } else if (event.clientX && event.clientY) {
    return { x: event.clientX, y: event.clientY };
  }
};

Map.prototype.getRooms = function () {
  return Game.rooms;
};

Map.prototype.drawRect = function (x, y) {
  this.ctx.strokeRect(x, y, this.roomSize.width, this.roomSize.height);
};

Map.prototype.drawArrow = function (ctx, x, y, size, dir) {
  let span = { x: 0, y: 0 };
  let rotation = 0;
  let initial = "";
  switch (dir) {
    case "south":
      span.y = this.roomSize.height / 2 + size;
      rotation = Math.PI * 0.5;
      initial = "S";
      break;
    case "west":
      span.x = -this.roomSize.width / 2 - size;
      rotation = Math.PI;
      initial = "W";
      break;
    case "east":
      span.x = this.roomSize.width / 2 + size;
      rotation = Math.PI * 4;
      initial = "E";
      break;
    case "north":
      span.y = -this.roomSize.height / 2 - size;
      rotation = -Math.PI * 0.5;
      initial = "N";
      break;
    case "northwest":
      span.y = -this.roomSize.height / 2;
      span.x = -this.roomSize.width / 2;
      rotation = -Math.PI * 0.75;
      initial = "NW";
      break;
    case "northeast":
      span.y = -this.roomSize.height / 2;
      span.x = this.roomSize.width / 2;
      rotation = -Math.PI * 0.25;
      initial = "NE";
      break;
    case "southeast":
      span.y = this.roomSize.height / 2;
      span.x = this.roomSize.width / 2;
      rotation = Math.PI * 0.25;
      initial = "SE";
      break;
    case "southwest":
      span.y = this.roomSize.height / 2;
      span.x = -this.roomSize.width / 2;
      rotation = Math.PI * 0.75;
      initial = "SW";
      break;
  }

  ctx.save();

  ctx.translate(x + span.x, y + span.y);
  ctx.rotate(rotation);
  ctx.save();
  ctx.rotate(Math.PI);
  ctx.restore();
  if (initial.length > 1) {
    ctx.setLineDash([6]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(25, 0);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size);
  ctx.lineTo(-size, size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  this.drawText(initial, x + span.x / 1.15, y + span.y / 1.15, 8, "#ffffff");
};

Map.prototype.drawRectDashed = function (x, y) {
  this.ctx.save();
  this.ctx.setLineDash([6]);
  this.ctx.strokeRect(x, y, this.roomSize.width, this.roomSize.height);
  this.ctx.restore();
};

Map.prototype.drawRectArrow = function (x, y, rotate) {
  this.ctx.save();
  this.ctx.rotate(rotate);
  this.ctx.strokeRect(x, y, 8, 32);
};

Map.prototype.drawText = function (str, x, y, font, color) {
  this.ctx.save();
  this.ctx.fillStyle = color || "#000000";
  this.ctx.font = `${font ? `${font}` : `bold 14`}px Arial`;
  this.ctx.textAlign = "center";
  this.ctx.textBaseline = "middle";
  this.ctx.fillText(str, x, y);
  this.ctx.restore();
};

$(window).on("load", function () {
  const map = new Map();
  map.draw();
});
