/**
 * Created by herrshi on 2017/7/4.
 */
define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/topic",
  "jimu/BaseWidget",
  "jimu/dijit/LoadingIndicator",
  "esri/tasks/PrintTask",
  "esri/tasks/PrintParameters",
  "esri/tasks/PrintTemplate"
], function (
  declare,
  lang,
  topic,
  BaseWidget,
  LoadingIndicator,
  PrintTask,
  PrintParameters,
  PrintTemplate
) {
  var clazz = declare([BaseWidget], {
    name: "Print",

    printingToolUrl: "http://{gisServer}/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
    printTask: null,


    postCreate: function () {
      var printingToolUrl = "http://{gisServer}/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
      printingToolUrl = printingToolUrl.replace(/{gisServer}/i, this.appConfig.gisServer);
      this.printTask = new PrintTask(printingToolUrl);

      topic.subscribe("Print", lang.hitch(this, this.onTopicHandler_print));
    },

    onTopicHandler_print: function () {
      var loading = new LoadingIndicator();
      loading.placeAt(window.jimuConfig.layoutId);

      var template = new PrintTemplate();
      template.format = "png32";
      template.layout = "MAP_ONLY";
      template.preserveScale = false;
      template.exportOptions = {
        width: 1600,
        height: 900,
        dpi: 96
      };
      var params = new PrintParameters();
      params.map = this.map;
      params.template = template;

      this.printTask.execute(params, function(evt){
        window.open(evt.url,"_blank");
        loading.destroy();
      });
    }
  });

  return clazz;

});