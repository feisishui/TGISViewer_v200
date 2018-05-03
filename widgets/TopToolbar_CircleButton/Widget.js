let timeOut;

class Item {
  constructor(icon, backgroundColor) {
    this.baseElement = $(document.createElement("div"));
    this.icon = icon;
    this.baseElement.addClass("item");
    this.baseElement.css("background-color", backgroundColor);
    let i = document.createElement("i");
    $(i).addClass("fa fa-" + icon);
    this.baseElement.append(i);
    this.prev = null;
    this.next = null;
    this.isMoving = false;
    let element = this;
    this.baseElement.on("mousemove", function() {
      clearTimeout(timeOut);
      timeOut = setTimeout(function() {
        if (element.next && element.isMoving) {
          element.next.moveTo(element);
        }
      }, 10);
    });
    this.baseElement.on("click", function () {

    });
  }

  moveTo(item) {
    anime({
      targets: this.baseElement[0],
      left: item.baseElement.css("left"),
      top: item.baseElement.css("top"),
      duration: 700,
      elasticity: 500
    });
    if (this.next) {
      this.next.moveTo(item);
    }
  }

  updatePosition() {
    anime({
      targets: this.baseElement[0],
      left: this.prev.baseElement.css("left"),
      top: this.prev.baseElement.css("top"),
      duration: 200
    });

    if (this.next) {
      this.next.updatePosition();
    }
  }
}



class Menu {
  constructor(menu) {
    this.baseElement = $(menu);
    this.size = 0;
    this.first = null;
    this.last = null;
    this.timeOut = null;
    this.hasMoved = false;
    this.status = "closed";
  }

  add(item) {
    let menu = this;
    if (this.first === null) {
      this.first = item;
      this.last = item;
      this.first.baseElement.on("mouseup", function() {
        if (menu.first.isMoving) {
          menu.first.isMoving = false;
        } else {
          menu.click();
        }
      });
      item.baseElement.draggable(
        {
          start: function() {
            menu.close();
            item.isMoving = true;
          }
        },
        {
          drag: function() {
            if (item.next) {
              item.next.updatePosition();
            }
          }
        },
        {
          stop: function() {
            item.isMoving = false;
            item.next.moveTo(item);
          }
        }
      );
    } else {
      this.last.next = item;
      item.prev = this.last;
      this.last = item;
    }
    this.baseElement.after(item.baseElement);
  }

  open() {
    this.status = "open";
    let current = this.first.next;
    let iterator = 1;
    let head = this.first;
    let sens = head.baseElement.css("left") < head.baseElement.css("right") ? 1 : -1;
    while (current !== null) {
      anime({
        targets: current.baseElement[0],
        left: parseInt(head.baseElement.css("left"), 10) + sens * (iterator * 50),
        top: head.baseElement.css("top"),
        duration: 500
      });
      iterator++;
      current = current.next;
    }
  }

  close() {
    this.status = "closed";
    let current = this.first.next;
    let head = this.first;
    let iterator = 1;
    while (current !== null) {
      anime({
        targets: current.baseElement[0],
        left: head.baseElement.css("left"),
        top: head.baseElement.css("top"),
        duration: 500
      });
      iterator++;
      current = current.next;
    }
  }

  click() {
    if (this.status === "closed") {
      this.open();
    } else {
      this.close();
    }
  }
}

define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "dojo/query",
  "jimu/BaseWidget"
], function(declare, lang, topic, query, BaseWidget) {
  return declare([BaseWidget], {
    baseClass: "jimu-widget-TopToolbarCircleButton",

    postCreate: function() {
      this.inherited(arguments);

      setTimeout(this._createButtons, 1000);

      topic.subscribe(
        "showTopToolbar",
        lang.hitch(this, this.onTopicHandler_showTopToolbar)
      );
    },

    _createButtons: function() {
      let menu = new Menu("#myMenu");
      let item1 = new Item("list", "#325aa3", this.map);
      let item2 = new Item("plus", "#5CD1FF", this.map);
      let item3 = new Item("minus", "#5CD1FF", this.map);
      let item4 = new Item("home", "#508bde", this.map);
      let item5 = new Item("arrow-circle-left", "#508bde", this.map);
      let item6 = new Item("arrow-circle-right", "#508bde", this.map);
      let item7 = new Item("pencil", "#ff9d5c", this.map);
      let item8 = new Item("floppy-o", "#ff9d5c", this.map);

      menu.add(item1);
      menu.add(item8);
      menu.add(item7);
      menu.add(item6);
      menu.add(item5);
      menu.add(item4);
      menu.add(item3);
      menu.add(item2);
    },

    onTopicHandler_showTopToolbar: function() {
      this._createButtons();
    },

    _onBtnZoomInClicked: function(){
      this.map._extentUtil({ numLevels: 1});
    },

    _onBtnZoomOutClicked: function(){
      this.map._extentUtil({ numLevels: -1});
    }
  });
});
