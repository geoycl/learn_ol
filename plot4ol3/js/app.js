/**
 * 动态标绘API plot4ol3，基于OpenLayer3开发，旨在为基于开源GIS技术做项目开发提供标绘API。
 * 当前版本1.0，提供的功能：绘制基本标绘符号。
 * 绘制接口: PlotDraw
 * 编辑接口: PlotEdit
 * 具体用法请参考演示系统源码。
 *
 * 开发者：@平凡的世界
 * QQ号：21587252
 * 邮箱：gispace@yeah.net
 * 博客：http://blog.csdn.net/gispace
 * 动态标绘交流QQ群：318659439
 *
 * 如果想要收到API更新消息，请开源项目页面评论中留下联系方式 http://git.oschina.net/ilocation/plot
 *
 * */
/*本demo是学习该系统的一个尝试*/

    var map, plotDraw, plotEdit, drawOverlay, drawStyle;
    // 自定义分辨率和瓦片坐标系
    var url = 'http://58.213.133.181:7791/tilemap/earth_image_geodetic/MapServer/tile/{z}/{y}/{x}';
    var resolutions = [            
        0.7031250000000001,
        0.35156250000000006,
        0.17578125000000003,
        0.08789062500000001,
        0.04394531250000001,
        0.021972656250000003,
		0.010986328125000002,
		0.005493164062500001,
		0.0027465820312500004,
		0.0013732910156250002,
	    0.0006866455078125001,
		0.00034332275390625005,
		0.00017166137695312503,
		8.583068847656251e-05,
		4.29153442382812e-05,
		2.14576721191406e-05,
		1.07288360595703e-05,
		5.36441802978516e-06,
		2.68220901489258e-06,
		1.34110450744629e-06,
		6.70552253723145e-07,
        3.35276126861572e-07
    ];

    let projection = ol.proj.get('EPSG:4326');

    var tilegrid  = new ol.tilegrid.TileGrid({
        tileSize: [256,256],        // 瓦片图片分辨率
        origin: [-180,90],          // 设置瓦片坐标原点坐标
        extent: [-180,-90,180,90],  // 这个范围显示瓦片
        resolutions: resolutions    // 设置分辨率
    });

    // 创建地科院地图的数据源
    var nnuSource = new ol.source.TileImage({
        projection: projection, 
        tileGrid: tilegrid,
        url: url,
        wrapX: false
    });

    // 地科院地图层
    var nnuMapLayer = new ol.layer.Tile({
        visible: true,
        source: nnuSource
    });

    var style = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 0, 0.6)'
        }),
        stroke: new ol.style.Stroke({
            color: '#319FD3',
            width: 3
        }),
        text: new ol.style.Text({
            font: '楷体',
            fill: new ol.style.Fill({
                color: '#000'
            }),
            stroke: new ol.style.Stroke({
                color: '#fff',
                width: 2
            })
        })
    });

    // 矢量图层
	var vectorLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: 'https://geo.datav.aliyun.com/areas/bound/520000_full.json',
            format: new ol.format.GeoJSON(),
            wrapX: false
        }),
        style: function(feature) {
            style.getText().setText(feature.get('name'));
            return style;
        }
    });

    /*var listenerKey = vectorLayer.getSource().on('change', function(){
        if (vectorLayer.getSource().getState() === 'ready') {    // 判定是否加载完成
            document.getElementById('count').innerHTML = vectorLayer.getSource().getFeatures().length;
            vectorLayer.getSource().unByKey(listenerKey);        // 注销监听器
        }
    });*/

function init() {

    map = new ol.Map({
        target: 'map',
        layers: [
            nnuMapLayer,
            vectorLayer,
        ],
        view: new ol.View({
            center: [106.642042,26.639891],
            zoom: 7,
            projection: 'EPSG:4326'
        })
    });

    map.on('click', function(e){
        if(plotDraw.isDrawing()){
            return;
        }
        var feature = map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
            return feature;
        });
        if(feature){
            // 开始编辑
            plotEdit.activate(feature);
            activeDelBtn();
        }else{
            // 结束编辑
            plotEdit.deactivate();
            deactiveDelBtn();
        }
    });

    // 初始化标绘绘制工具，添加绘制结束事件响应
    plotDraw = new P.PlotDraw(map);
    plotDraw.on(P.Event.PlotDrawEvent.DRAW_END, onDrawEnd, false, this);

    // 初始化标绘编辑工具
    plotEdit = new P.PlotEdit(map);

    // 设置标绘符号显示的默认样式
    var stroke = new ol.style.Stroke({
        color: '#FF0000',
        width: 2
    });

    var fill = new ol.style.Fill({color: 'rgba(0,255,0,0.4)'});
    var image = new ol.style.Circle({fill: fill, stroke: stroke, radius: 8});
    drawStyle = new ol.style.Style({image: image, fill:fill, stroke:stroke});

    // 绘制好的标绘符号，添加到FeatureOverlay显示。
    drawOverlay = new ol.layer.Vector({
        source: new ol.source.Vector()
    });
    
    drawOverlay.setStyle(drawStyle);
    drawOverlay.setMap(map);

    get('btn-delete').onclick = function(){
        if(drawOverlay && plotEdit && plotEdit.activePlot){
            drawOverlay.getSource().removeFeature(plotEdit.activePlot);
            plotEdit.deactivate();
            deactiveDelBtn();
        }
    };

    // 初始化加载一个扇形标绘符号
    /*var sector = new P.PlotFactory.createPlot(P.PlotTypes.SECTOR, [center, [3439054.77660665,1814920.7996032247], [3693437.2067397167,914798.3545169891]]);
    var feature = new ol.Feature({
        geometry: sector
    });
    drawOverlay.getSource().addFeature(feature);*/
}

// 绘制结束后，添加到FeatureOverlay显示。
function onDrawEnd(event){
    var feature = event.feature;
    drawOverlay.getSource().addFeature(feature);
    // 开始编辑
    plotEdit.activate(feature);
    activeDelBtn();
}

// 指定标绘类型，开始绘制。
function activate(type){
    plotEdit.deactivate();
    plotDraw.activate(type);
};

function get(domId){
    return document.getElementById(domId);
}

function activeDelBtn(){
    get('btn-delete').style.display = 'inline-block';
}

function deactiveDelBtn(){
    get('btn-delete').style.display = 'none';
}
