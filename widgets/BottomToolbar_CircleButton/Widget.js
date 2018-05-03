define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/fx",
  "dojo/query",
  "dojo/on",
  "dojo/topic",
  "dojo/dom-class",
  "dojo/dom-style",
  "dojo/dom-attr",
  "jimu/BaseWidget"
], function(
  declare,
  lang,
  fx,
  query,
  on,
  topic,
  domClass,
  domStyle,
  domAttr,
  BaseWidget
) {
  return declare([BaseWidget], {
    baseClass: "jimu-widget-BottomToolbarCircleButton",

    _disabledClass: "disable",
    _activeClass: "active",

    postCreate: function() {
      this.inherited(arguments);

      this._createButton();
    },

    _createButton: function() {
      let buttonContainer = query(
        "#BottomToolbarButtonContainer",
        this.domNode
      );

      this.config.buttons.forEach(
        lang.hitch(this, function(buttonObj) {
          let buttonContent;
          if (buttonObj.image) {
            buttonContent = "<img src='" + window.path + buttonObj.image + "'>";
          } else if (buttonObj.fontClass) {
            buttonContent = "<i class='" + buttonObj.fontClass + "'></i>";
          }
          buttonContainer.addContent(
            "<button type='button' class='nav_btn_button " +
              (!!buttonObj.initEnable ? this._activeClass : "") +
              "' title='" +
              buttonObj.label +
              "' data-operations='" +
              JSON.stringify(buttonObj.operations) +
              "'>" +
              buttonContent +
              "</button>"
          );
        })
      );

      query(".nav_btn_button", this.domNode).on(
        "click",
        lang.hitch(this, this.onButton_click)
      );
    },

    onButton_click: function(event) {
      let target = event.target;

      domClass.toggle(target, this._activeClass);

      let label = domAttr.get(target, "title");
      let enable = domClass.contains(target, this._activeClass);
      let operations = domAttr.get(target, "data-operations");
      if (operations !== "undefined") {
        operations = JSON.parse(operations);
        operations.forEach(
          lang.hitch(this, function(operation) {
            switch (operation.opName.toLowerCase()) {
              case "changeLayer".toLowerCase():
                let layerName = operation.opParam
                  ? operation.opParam[0]
                  : label;
                topic.publish("setLayerVisibility", {
                  label: layerName,
                  visible: enable
                });
                break;
            }
          })
        );
      }
    },

    onDomNode_mouseover: function() {
      query(".popup_bottom_arrowUp").addClass("opacity-0");
      query(".popup_bottom_arrowUp").removeClass("opacity-1");
    },

    onDomNode_mouseout: function() {
      query(".popup_bottom_arrowUp").addClass("opacity-1");
      query(".popup_bottom_arrowUp").removeClass("opacity-0");
    },

    onArrow_click: function() {
      let arrowNode = query(".popup_bottom_arrowUp")[0];
      if (domClass.contains(arrowNode, "clicked")) {
        fx
          .animateProperty({
            node: query(".popup_bottom_inner")[0],
            properties: {
              marginBottom: -85
            }
          })
          .play();
        domStyle.set(arrowNode, "transform", "rotate(0deg)");
        domClass.remove(arrowNode, "clicked");
      } else {
        fx
          .animateProperty({
            node: query(".popup_bottom_inner")[0],
            properties: {
              marginBottom: 0
            }
          })
          .play();
        domStyle.set(arrowNode, "transform", "rotate(180deg)");
        domClass.add(arrowNode, "clicked");
      }
    }
  });
});
