// PlayerInputHandler.js - Handles all player input
cc.Class({
  extends: cc.Component,

  onLoad() {
    this.initInput();
  },

  onDestroy() {
    this.destroyInput();
  },

  initInput() {
    this.keyPressed = {};
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  destroyInput() {
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
  },

  onKeyDown(event) {
    this.keyPressed[event.keyCode] = true;
  },

  onKeyUp(event) {
    this.keyPressed[event.keyCode] = false;
  },

  getInputDirection() {
    const keys = cc.macro.KEY;
    let dir = cc.v2(0, 0);
    if (this.keyPressed[keys.a]) dir.x -= 1;
    if (this.keyPressed[keys.d]) dir.x += 1;
    if (this.keyPressed[keys.w]) dir.y += 1;
    if (this.keyPressed[keys.s]) dir.y -= 1;
    return dir;
  },

  isKeyPressed(keyCode) {
    return this.keyPressed[keyCode] || false;
  },
});
