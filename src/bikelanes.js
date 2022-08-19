/*
* https://deck.gl/docs/api-reference/geo-layers/trips-layer

from https://codepen.io/pen?&editors=001

https://deck.gl/docs/get-started/using-standalone

https://deck.gl/docs/api-reference/core/view

https://ckochis.com/deck-gl-time-frame-animations

https://deck.gl/docs/developer-guide/custom-layers/layer-lifecycle

https://deck.gl/docs/faq

https://stackoverflow.com/questions/59296549/deck-gl-without-react-but-with-webpack-is-not-rendered-the-specified-container

https://deck.gl/docs/developer-guide/interactivity

https://github.com/streamlit/streamlit/issues/475

https://deck.gl/docs/api-reference/layers/bitmap-layer

https://deck.gl/docs/api-reference/geo-layers/tile-layer

https://deck.gl/docs/api-reference/layers/text-layer

https://deck.gl/docs/api-reference/layers/path-layer


*/

import {Deck} from '@deck.gl/core';
import { TripsLayer } from '@deck.gl/geo-layers';
import {ScatterplotLayer} from '@deck.gl/layers';
import {PolygonLayer} from '@deck.gl/layers';
import {BitmapLayer} from '@deck.gl/layers';
import {TileLayer} from '@deck.gl/geo-layers';
import {TextLayer} from '@deck.gl/layers';


import {MapView} from '@deck.gl/core';

const INITIAL_VIEW_STATE = {
  longitude: 8.4013, // -122.4,
  latitude: 49.0045, // 37.74,
  zoom: 12,
  minZoom: 0,
  maxZoom: 20,
  pitch: 0, // (Number, optional) - pitch angle in degrees. Default 0 (top-down). was 30
  bearing: 0 //  (Number, optional) - bearing angle in degrees. Default 0 (north).
};


const LABEL_VIEW_STATE = {
  longitude: INITIAL_VIEW_STATE.longitude, // - .1, // -122.4,
  latitude: INITIAL_VIEW_STATE.latitude, // + .01, // 37.74,
  zoom: 11,
  minZoom: 11,
  maxZoom: 11,
  pitch: 0, // (Number, optional) - pitch angle in degrees. Default 0 (top-down). was 30
  bearing: 0 //  (Number, optional) - bearing angle in degrees. Default 0 (north).
};


const tiles = new TileLayer({
  // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
  id: 'TileLayer',
  data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',

  zoom: INITIAL_VIEW_STATE.zoom,
  minZoom: INITIAL_VIEW_STATE.minZoom,
  maxZoom: INITIAL_VIEW_STATE.maxZoom,
  tileSize: 256,

  renderSubLayers: props => {
    const {
      bbox: {west, south, east, north}
    } = props.tile;

    return new BitmapLayer(props, {
      data: null,
      image: props.data,
      bounds: [west, south, east, north]
    });
  }
});

async function mkLabel(lbl = "Jahr ...") {
  const labels = new TextLayer({
    id: 'TextLayer',
    data: [
      {
        name: lbl.toString(),
        coordinates: [LABEL_VIEW_STATE.longitude, LABEL_VIEW_STATE.latitude]
      },
    ],
    pickable: false,
    getPosition: d => d.coordinates,
    getText: d => d.name,
    getSize: 24,
    getAngle: 0,
    getTextAnchor: 'middle',
    getAlignmentBaseline: 'center'
  })
 return labels
}


var tripData = []

async function mkTrips(tm = 500) {
  const trips = await new TripsLayer({
    id: 'TripsLayer',
    data: '/data/lanes.json', // trips2.json', // sf-trips.json',
    
    /* props from TripsLayer class */
    
    currentTime: tm,
    //fadeTrail: false, // default: true
    // modify timetamps
    //getTimestamps: d => d.waypoints.map(p => p.timestamp - 1554772579000),
    getTimestamps: d => d.waypoints.map(p => p.timestamp),
    //getColor: [253, 128, 93],
    // can use color from trip, don't neet color per point
    getColor: d => d.color, // d.waypoints.map(p => p.color),
    trailLength: 600,
    
    /* props inherited from PathLayer class */
    
    // billboard: false,
    capRounded: true,
    getPath: d => d.waypoints.map(p => p.coordinates),
    // getWidth: 1,
    jointRounded: true,
    // miterLimit: 4,
    // rounded: true,
    // widthMaxPixels: Number.MAX_SAFE_INTEGER,
    widthMinPixels: 8,
    // widthScale: 1,
    // widthUnits: 'meters',
    
    /* props inherited from Layer class */
    
    // autoHighlight: false,
    // coordinateOrigin: [0, 0, 0],
    // coordinateSystem: COORDINATE_SYSTEM.LNGLAT,
    // highlightColor: [0, 0, 128, 128],
    // modelMatrix: null,
    opacity: 0.8,
    // pickable: false,
    // visible: true,
    // wrapLongitude: false,
  
  });
  return trips
}    

//var trackData

function layerFilter({layer, viewport}) {
  if (viewport.id === 'label' && layer.id === 'TripsLayer') {
    // Exclude layer on view
    return false;
  }
  if (viewport.id === 'label' && layer.id === 'TileLayer') {
    return false;
  }
  if (viewport.id === 'map' && layer.id === 'TextLayer') {
    return false;
  }
  //console.log("Filter:",layer,viewport)
  return true;
} 

//new DeckGL({
const deckgl = new Deck({
    // The container to append the auto-created canvas to.
    parent: document.getElementById("#deck"), //document.body,
    canvas: "cv", // document.getElementById("#cv"), // unset
    width: "1280",
    height: "720px",
    //mapStyle: '/data/sf-style.json', // trips
    //mapStyle: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json",
  initialViewState: INITIAL_VIEW_STATE,
  controller: {dragRotate: false}, //true,
  layerFilter: layerFilter,
  layers: [tiles],
  views: [
    new MapView({
      id:"map",
      initialViewState: INITIAL_VIEW_STATE,
      controller: {dragRotate: false},
      x: 0,
      y: 0, 
      width: "100%",
      height: "100%",
    }),
    new MapView({
      id:"label",
      x: 0,
      y: 0, 
      width: "100px",
      height: "30px",
      initialViewState: LABEL_VIEW_STATE,
      controller: false,
    }),
  ]

});
  
var tm = 0;
var speed = .50

function setS(e) {
  speed = parseInt(e.target.value/10)
  console.log("Speed:",speed)
}

async function restart() {
  tm = 0
}

document.getElementById("sets").addEventListener("input",setS)
document.getElementById("restart").addEventListener("click",restart)

async function animate() {
  const tmVal = document.getElementById("tm") || null
  if (tmVal != null)
    tmVal.innerHTML = tm.toString()

  if (tm == 0) {
      // maybe we could load the data here and initialize all paths.
      // don't know how to do this yet ...
    } else {
      if (!video.recording) {
        video.startRecoding()
      }
    }
    if (tm < 11 * 52) {
        tm += speed
        //console.log("Current:",tm)
        const trips = await mkTrips(tm)
        // time is in weeks, first year is 2012
        const year = Math.floor(2012 + tm/52)
        const labels = await mkLabel(year)
        //deckgl.setProps({layers: [tiles, trips, scatter, bmap, bg]});
        await deckgl.setProps({layers: [tiles, trips, labels]});
        /*
        var canvas = document.getElementById("cv") || null;
        if (canvas) {
          console.log("Canvas")
          var ctx = await canvas.getContext("webgl2") || null;
          // for handling text in webgl2 see e.g. 
          // https://webgl2fundamentals.org/webgl/lessons/webgl-text-html.html
          if (ctx) {
            console.log("Context")
            ctx.font = "30px Arial";
            await ctx.fillText("Hello World", 10, 50); 
          }
        }
        */

        setTimeout(animate,100)
    } else {
        console.log("Finished")
        video.recorder.stop()
        tm = 0
        setTimeout(animate,100)
    }
  }

/*
  // load data 
fetch("/data/trips.json")
.then((response) => response.json())
.then((data) => {
  console.log(data.data)
  tripData = data.data
  setTimeout(animate,1000)
  }
)
*/
setTimeout(animate,1000)

// ------ video 

// ffmpeg -err_detect ignore_err -i video-app4.webm -c copy v.webm



const video = {
  chunks: [], 
  stream: null,
  recorder: null,
  blob: null,
  recording: false,

  startRecoding: function () {
    const canvas = document.getElementById("cv")
    if (!canvas) return
    console.log("Canvas:",canvas)
    video.stream = canvas.captureStream(); // fps// Create media recorder from canvas stream
    // available codecs must be tested. edge supports webm/vp9, firefox doesnt
    video.recorder = new MediaRecorder(video.stream, { mimeType: "video/webm" });// Record data in chunks array when data is available
    /*
    try {
      video.recorder = new MediaRecorder(video.stream, { mimeType: "video/webm; codecs=vp9" });// Record data in chunks array when data is available
    } catch (e) {
      video.recorder = new MediaRecorder(video.stream, { mimeType: "video/webm; codecs=vp8" });// Record data in chunks array when data is available
    }
    */
    video.recorder.ondataavailable = (evt) => { video.chunks.push(evt.data); };// Provide recorded data when recording stops
    video.recorder.onstop = () => {video.stopRecoding(video.chunks);}// Start recording using a 1s timeslice [ie data is made available every 1s)
    video.recorder.start();
    video.recording = true

  },
  stopRecoding: async function (chunks) {
    video.blob = new Blob(chunks, {type: "video/webm" });
    const recording_url = await URL.createObjectURL(video.blob);// Attach the object URL to an <a> element, setting the download file name
    const a = document.createElement('a');
    a.href = recording_url;
    a.id = "down"
    a.download = "video-app4.webm"
    a.innerHTML = "Download"
    document.getElementById("ui").appendChild(a)// Trigger the file download
    // maybe this too. triggers immediate download ...
    a.click()
    setTimeout(() => {
      // Clean up - see https://stackoverflow.com/a/48968694 for why it is in a timeout
      URL.revokeObjectURL(recording_url);
      document.getElementById("ui").removeChild(a);
    }, 5000);
    
  },
}
