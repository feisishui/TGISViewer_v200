define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/dom-class",
  "dojo/dom-attr",
  "dojo/query",
  "dojo/topic",
  "dojo/on",
  "jimu/BaseWidget"
], function (
  declare,
  lang,
  domClass,
  domAttr,
  query,
  topic,
  on,
  BaseWidget
) {
  return declare([BaseWidget], {
    baseClass: "jimu-widget-BottomToolbar",

    _disabledClass: "btn-disable",
    _activeClass: "btn-active",

    postCreate: function(){
      this.inherited(arguments);

      this._createButtons();
    },

    _createButtons: function () {
      var buttonContainer = query("#BottomToolbarButtonContainer", this.domNode);

      this.config.buttons.forEach(lang.hitch(this, function (buttonObj) {
        console.log(JSON.stringify(buttonObj.operations));
        buttonContainer.addContent(
          "<span>" +
            "<button class='btn btn-black " + (!!buttonObj.initEnable ? this._activeClass : "") + "'" +
                   " style='margin-right: 3px' data-toggle='tooltip' data-placement='bottom' " +
                   " data-operations='" + JSON.stringify(buttonObj.operations) + "'" +
                   " title='" + buttonObj.label + "'>" +
              "<img src='" + window.path + buttonObj.image + "'>" +
            "</button>" +
          "</span>");
      }));

      this.own(query(".btn-black", this.domNode).on("click", lang.hitch(this, this._onBottomButtonClick)));
    },

    _onBottomButtonClick: function (event) {
      var target = event.target;
      if (target.tagName === "IMG") {
        target = target.parentNode;
      }

      domClass.toggle(target, this._activeClass);

      var label = domAttr.get(target, "title");
      var enable = domClass.contains(target, this._activeClass);

      var operations = domAttr.get(target, "data-operations");
      if (operations !== "undefined") {
        operations = JSON.parse(operations);
        operations.forEach(lang.hitch(this, function (operation) {
          switch (operation.opName.toLowerCase()) {
            case "changeLayer".toLowerCase():
              var layerName = operation.opParam ? operation.opParam[0] : label;
              topic.publish("setLayerVisibility", {label: layerName, visible: enable});
              break;
          }
        }));
      }

    }
  });
});