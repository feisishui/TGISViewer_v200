define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/topic",
  "dojo/promise/all",
  "jimu/BaseWidget",
  "jimu/utils",
  "jimu/dijit/LoadingIndicator",
  "esri/layers/GraphicsLayer",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/layers/FeatureLayer",
  "esri/symbols/SimpleLineSymbol",
  "esri/tasks/FindTask",
  "esri/tasks/FindParameters",
  "esri/tasks/QueryTask",
  "esri/tasks/query",
  "esri/Color",
  "esri/graphic"
], function(
  declare,
  lang,
  array,
  topic,
  all,
  BaseWidget,
  jimuUtils,
  LoadingIndicator,
  GraphicsLayer,
  ArcGISDynamicMapServiceLayer,
  FeatureLayer,
  SimpleLineSymbol,
  FindTask,
  FindParameters,
  QueryTask,
  Query,
  Color,
  Graphic
) {
  var clazz = declare([BaseWidget], {
    name: "FindFeature",

    resultLayer: null,
    highlightLayer: null,
    defaultPointSymbol: null,
    defaultPolylineSymbol: null,
    defaultPolygonSymbol: null,
    defaultHighlightSymbol: null,

    _showResult: true,
    _centerResult: true,

    postCreate: function() {
      this.inherited(arguments);
      this.resultLayer = new GraphicsLayer();
      this.map.addLayer(this.resultLayer);

      this.highlightLayer = new GraphicsLayer();
      this.map.addLayer(this.highlightLayer);

      this.defaultPolylineSymbol = new SimpleLineSymbol(
        SimpleLineSymbol.STYLE_SOLID,
        new Color([255, 0, 0, 255]),
        4
      );

      this.defaultHighlightSymbol = new SimpleLineSymbol(
        SimpleLineSymbol.STYLE_SOLID,
        new Color([255, 0, 0, 255]),
        4
      );

      topic.subscribe(
        "findFeature",
        lang.hitch(this, this.onTopicHandler_findFeature)
      );

      topic.subscribe(
        "startHighlightFeature",
        lang.hitch(this, this.onTopicHandler_startHighlightFeature)
      );

      topic.subscribe(
        "stopHighlightFeature",
        lang.hitch(this, this.onTopicHandler_stopHighlightFeature)
      );
    },

    _doFindTask: function(url, ids) {
      var deferredArray = [];
      var loading = new LoadingIndicator();
      loading.placeAt(window.jimuConfig.layoutId);

      array.forEach(ids, function(id) {
        var findTask = new FindTask(url);
        var findParam = new FindParameters();
        findParam.searchFields = ["FEATUREID"];
        findParam.searchText = id;
        findParam.layerIds = [0];
        findParam.returnGeometry = true;
        deferredArray.push(findTask.execute(findParam));
      });
      all(deferredArray).then(
        lang.hitch(this, function(results) {
          array.forEach(
            results,
            function(result) {
              array.forEach(
                result,
                function(findResult) {
                  var graphic = findResult.feature;
                  switch (graphic.geometry.type) {
                    case "polyline":
                      graphic.symbol = this.defaultPolylineSymbol;
                      break;
                  }

                  this.resultLayer.add(graphic);
                },
                this
              );
            },
            this
          );
          loading.destroy();
        }),
        function(error) {
          console.log(error);
          loading.destroy();
        }
      );
    },

    _doQueryTaskOnFeatureLayer: function(url, ids) {
      var loading = new LoadingIndicator();
      loading.placeAt(window.jimuConfig.layoutId);

      var where = "";
      array.forEach(ids, function(id) {
        where += "FEATUREID = '" + id + "' OR ";
      });
      //去掉最后的" OR "共四个字符
      where = where.substr(0, where.length - 4);

      var queryTask = new QueryTask(url);
      var query = new Query();
      query.returnGeometry = true;
      query.where = where;
      query.outFields = ["*"];
      queryTask.execute(
        query,
        lang.hitch(this, function(featureSet) {
          featureSet.features.forEach(function(graphic) {
            if (this._showResult) {
              var node = graphic.getNode();
              node.setAttribute("data-highlight", "highlight");
              setTimeout(function() {
                node.setAttribute("data-highlight", "");
              }, 5000);
            }
            if (this._centerResult) {
              this.map.centerAt(jimuUtils.getGeometryCenter(graphic.geometry));
            }
          }, this);

          loading.destroy();
        }),
        function(error) {
          console.log(error);
          loading.destroy();
        }
      );
    },

    _findInGraphicsLayer: function(graphicsLayer, ids) {
      console.log(graphicsLayer.mode, FeatureLayer.MODE_SNAPSHOT);
      graphicsLayer.graphics.forEach(function(graphic) {
        var attr = graphic.attributes;
        var id;
        for (var fieldName in attr) {
          if (attr.hasOwnProperty(fieldName)) {
            if (
              fieldName.indexOf("DEVICEID") > -1 ||
              fieldName.indexOf("BM_CODE") > -1 ||
              fieldName.indexOf("FEATUREID") > -1
            ) {
              id = attr[fieldName];
            }
          }
        }
        if (ids.indexOf(id) >= 0) {
          if (this._showResult) {
            if (this._centerResult) {
              this.map
                .centerAt(jimuUtils.getGeometryCenter(graphic.geometry))
                .then(function(value) {
                  var node = graphic.getNode();
                  node.setAttribute("data-highlight", "highlight");
                  setTimeout(function() {
                    node.setAttribute("data-highlight", "");
                  }, 5000);
                });
            }
          }
        }
      }, this);
    },

    onTopicHandler_findFeature: function(params) {
      var layerName = params.params.layerName || "";
      var ids = params.params.ids || "";
      this._showResult = params.params.showResult !== false;
      this._centerResult = params.params.centerResult === true;

      if (layerName === "" || ids === "") {
        return;
      }

      //在DynamicService中查找
      for (var i = 0; i < this.map.layerIds.length; i++) {
        var layer = this.map.getLayer(this.map.layerIds[i]);
        //如果是Dynamic Service, 用FindTask查询服务中的所有图层
        if (
          layer.label === layerName &&
          layer instanceof ArcGISDynamicMapServiceLayer
        ) {
          this._doFindTask(layer.url, ids);
          return;
        }
      }

      //在FeatureLayer或GraphicsLayer中查找
      for (i = 0; i < this.map.graphicsLayerIds.length; i++) {
        layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
        if (layer.label === layerName && layer instanceof FeatureLayer) {
          // this._doQueryTaskOnFeatureLayer(layer.url, ids);
          this._findInGraphicsLayer(layer, ids);
        }
      }
    },

    onTopicHandler_startHighlightFeature: function(params) {
      //高亮
      this._startHighlightFeature(params);
    },
    _startHighlightFeature: function(params) {
      var layerName = params.layerName || "";
      var ids = params.ids || "";

      if (layerName === "" || ids === "") {
        return;
      }
      //在DynamicService中查找
      for (var i = 0; i < this.map.layerIds.length; i++) {
        var layer = this.map.getLayer(this.map.layerIds[i]);
        //如果是Dynamic Service, 用FindTask查询服务中的所有图层
        if (
          layer.label === layerName &&
          layer instanceof ArcGISDynamicMapServiceLayer
        ) {
          this._doHighlightFindTask(layer.url, ids, layerName);
          return;
        }
      }

      //在FeatureLayer或GraphicsLayer中查找
      for (i = 0; i < this.map.graphicsLayerIds.length; i++) {
        layer = this.map.getLayer(this.map.graphicsLayerIds[i]);
        if (layer.label === layerName && layer instanceof FeatureLayer) {
          // this._doQueryTaskOnFeatureLayer(layer.url, ids);
          this._findInHighlightGraphicsLayer(layer, ids);
        }
      }
    },

    _doHighlightFindTask: function(url, ids, layerName) {
      var deferredArray = [];

      array.forEach(ids, function(id) {
        var findTask = new FindTask(url);
        var findParam = new FindParameters();
        findParam.searchFields = ["DEVICEID", "BM_CODE", "FEATUREID"];
        findParam.searchText = id;
        findParam.layerIds = [0];
        findParam.returnGeometry = true;
        deferredArray.push(findTask.execute(findParam));
      });
      all(deferredArray).then(
        lang.hitch(this, function(results) {
          array.forEach(
            results,
            function(result) {
              array.forEach(
                result,
                function(findResult) {
                  var graphic = findResult.feature;
                  graphic.label = layerName;
                  graphic.id = findResult.value;
                  switch (graphic.geometry.type) {
                    case "polyline":
                      graphic.symbol = this.defaultHighlightSymbol;
                      break;
                  }
                  this.highlightLayer.add(graphic);

                  var node = graphic.getNode();
                  node.setAttribute("data-highlight", "always-highlight");
                },
                this
              );
            },
            this
          );
        }),
        function(error) {
          console.log(error);
        }
      );
    },

    _findInHighlightGraphicsLayer: function(graphicsLayer, ids) {
      graphicsLayer.graphics.forEach(function(graphic) {
        var attr = graphic.attributes;
        var id;
        for (var fieldName in attr) {
          if (attr.hasOwnProperty(fieldName)) {
            if (
              fieldName.indexOf("DEVICEID") > -1 ||
              fieldName.indexOf("BM_CODE") > -1 ||
              fieldName.indexOf("FEATUREID") > -1
            ) {
              id = attr[fieldName];
            }
          }
        }
        if (ids.indexOf(id) >= 0) {
          var highlightgraphic = new Graphic(graphic.toJson());
          highlightgraphic.id = id;
          highlightgraphic.label = graphic.getLayer().label;
          switch (highlightgraphic.geometry.type) {
            case "polyline":
              highlightgraphic.symbol = this.defaultHighlightSymbol;
              break;
          }
          this.highlightLayer.add(highlightgraphic);

          var node = highlightgraphic.getNode();
          node.setAttribute("data-highlight", "always-highlight");
        }
      }, this);
    },
    onTopicHandler_stopHighlightFeature: function(params) {
      //停止高亮
      var layerName = params.layerName || "";
      var ids = params.ids || "";

      this.highlightLayer.graphics.forEach(function(graphic) {
        var attr = graphic.attributes;
        var id;
        if (layerName === graphic.label) {
          for (var fieldName in attr) {
            if (attr.hasOwnProperty(fieldName)) {
              if (
                fieldName.indexOf("DEVICEID") > -1 ||
                fieldName.indexOf("BM_CODE") > -1 ||
                fieldName.indexOf("FEATUREID") > -1
              ) {
                id = attr[fieldName];
              }
            }
          }
          if (ids === "" || ids.indexOf(id) >= 0) {
            var node = graphic.getNode();
            if (node) {
              node.setAttribute("data-highlight", "");
            }
            this.highlightLayer.remove(graphic);
          }
        }
      }, this);
    }
  });

  return clazz;
});
