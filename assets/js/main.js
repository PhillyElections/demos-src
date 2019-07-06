// 
// // map code - abandoned week selector
// (function(scoped) {
//     scoped(window.jQuery, window.L, window, document)
// }(function($, L, W, D) {
//     'use strict'
//     L.Icon.Default.imagePath='assets/img'
//     var ie = /msie ([0-9]+)\.[0-9]+/.exec(navigator.userAgent.toLowerCase()),
//         DEBUG = 0,
//         GATEKEEPER_KEY = 'f2e3e82987f8a1ef78ca9d9d3cfc7f1d',
//         CITY_HALL = [39.95262, -75.16365],
//         MINZOOM = 11,
//         ZOOM = 13,
//         MAXZOOM = 18,
//         BASEMAP1 = '//tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer',
//         BASEMAP1_LABELS = '//tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer',
//         BASEMAP2 = '//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
//         baseUri = W.baseUri,
//         Titles = {'past': 'Completed', 'future': 'Upcoming'},
//         Active = [],
//         All = [],
//         GrouperContext = [],
//         LastAddressComplete = [],
//         AllIndexes = [],
//         FeatureGroup,
//         LmapFuture,
//         LmapPast,
//         endMarker,
//         Panels = [],
//         Weeks = [],
//         WeekNumberRanges = [],
//         Wards = [],
//         wardDivision,
//         searchBox,
//         divisions,
//         wards,
//         months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
//         Icons = {
//             p: L.spriteIcon('red'),
//             f: L.spriteIcon()
//         },
//         Services = {
//             demos: '//cloudapis3.philadelphiavotes.com/demos',
//             demos_past: '//cloudapis3.philadelphiavotes.com/demos/past',
//             demos_future: '//cloudapis3.philadelphiavotes.com/demos/future'
//         };
// 
//     // begin ajax functions
// 
//     function getMarkersPromise(service) {
//         // Return a new promise.
//         return new Promise(function(resolve, reject) {
//             // Do the usual XHR stuff
//             var req = new XMLHttpRequest();
//             req.open('GET', service);
// 
//             req.onload = function() {
//                 // This is called even on 404 etc
//                 // so check the status
//                 if (req.status == 200) {
//                     // Resolve the promise with the response text
//                     resolve(req.response);
//                 } else {
//                     // Otherwise reject with the status text
//                     // which will hopefully be a meaningful error
//                     reject(Error(req.statusText));
//                 }
//             };
// 
//             // Handle network errors
//             req.onerror = function() {
//                 reject(Error("Network Error"));
//             };
// 
//             // Make the request
//             req.send();
//         });
//     }
// 
//     // end ajax functions
// 
//     function setDefaultBasemaps(Lmap) {
//         CN(arguments)
//         if (BASEMAP1) {
//             L.esri.tiledMapLayer({
//                 url: BASEMAP1
//             }).addTo(Lmap)
//         }
//         if (BASEMAP1_LABELS) {
//             L.esri.tiledMapLayer({
//                 url: BASEMAP1_LABELS
//             }).addTo(Lmap)
//         }
//     }
// 
//     function clearMarkers(Lmap) {
//         CN(arguments)
// 
//         Active[Lmap.options.type].forEach(function(idx) {
//             Lmap.removeLayer(idx);
//         });
//         Active[Lmap.options.type] = []
//     }
// 
//     // end map functions
// 
//     // my utils
// 
//     // utils
//     $.support.cors = true;
// 
//     String.prototype.toProperCase = function() {
//         return this.replace(/\w\S*/g, function(a) {
//             return a.charAt(0).toUpperCase() + a.substr(1).toLowerCase();
//         });
//     };
// 
//     function getYearWeekNumber(d) {
//         // Set to nearest Thursday: current date + 4 - current day number
//         // Make Sunday's day number 7
//         d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
//         // Get first day of year
//         var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
//         // Calculate full weeks to nearest Thursday
//         var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
//         // Return array of year and week number
//         return [d.getUTCFullYear()+"-"+weekNo];
//     }
// 
//     function pad(n, width, z) {
//         n = n + '' // cast to string
//         z = z || '0' // default padding: '0'
//         width = width || 2 // default digits: 2
//         return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
//     }
// 
//     function CN(args) {
        // 
//         if (!DEBUG) {
//             return;
//         }
//         var re = /function (.*?)\(/;
//         var s = CN.caller.toString();
//         var m = re.exec(s);
//         console.log(m[1],args.length ? args : "");
//     }
// 
//     function mapSetup(mapId, options) {
//         CN(arguments)
// 
//         D.getElementById(mapId).style.zIndex = 1
//         var Lmap = L.map(mapId, { zoomControl: false } ).setView(CITY_HALL, ZOOM)
//         Lmap.options.minZoom = MINZOOM
//         Lmap.options.maxZoom = MAXZOOM
//         Object.keys(options).forEach(function(idx) {
//             Lmap.options[idx] = options[idx]
//         })
// 
// 
//         new L.Control.Zoom({ position: 'topright' }).addTo(Lmap);
// 
//         // map events setup
//         Lmap.on('zoom', function(e) { })
// 
//         // set up layers
//         setDefaultBasemaps(Lmap)
//         //setAlternateBasemaps()
//         return Lmap;
//     }
// 
//     function setInitialMarkers(Lmap, jsn) {
//         CN(arguments)
// 
//         var ward, ward_select, week_select, title, marker, wards = [], weeks = [],
//             options = ''
// 
//         // setup our 'global' arrays
//         // active 
//         Active[Lmap.options.type] = []
//         // all
//         All[Lmap.options.type] = []
//         // wards past/future (wards to be set)
//         Wards[Lmap.options.type] = []
//         // wards past/future (wards to be set)
//         Weeks[Lmap.options.type] = []
//         // wards past/future (wards to be set)
//         WeekNumberRanges[Lmap.options.type] = []
//         // display panel(s)
//         Panels[Lmap.options.type] = null
//         for (var i = 0; i < jsn.features.length; i++) {
//             // extrapolate ward from precinct
//             ward = pad(jsn.features[i].attributes.precinct, 4).substr(0, 2)
//             marker = L.marker(jsn.features[i].coordinates, {
//                 attributes: jsn.features[i].attributes,
//                 icon: Icons[Lmap.options.iconType]
//             }).on('click', function() {
//                 // zoom into this marker (without clearing set markers)
//                 focusMap(Lmap, this)
//                 // display event panel
//                 showPanel(Lmap, this)
//             })
//             All[Lmap.options.type].push(marker)
//             if ('undefined' == typeof Wards[Lmap.options.type][ward]) {
//                 Wards[Lmap.options.type][ward] = []
//                 wards[Number(ward)] = ward
//             }
//             Wards[Lmap.options.type][ward].push(marker)
// 
//             var date = new Date(marker.options.attributes.start),
//                 dow = date.getDay(),
//                 Sunday,
//                 Saturday,
//                 WeekStart
//             if (dow) {
//                 date.setDate(date.getDate() - dow)
//             }
//             WeekStart = 'M d, Y'
//               .replace("M", months[date.getMonth()])
//               .replace("d", date.getDate() + "-" + (date.getDate() + 6))
//               .replace('Y', date.getFullYear())
//             Sunday = 'Y-m-d'
//               .replace('Y', date.getFullYear())
//               .replace('m', pad(date.getMonth()+1,2))
//               .replace('d', pad(date.getDate(),2));
//             date.setDate(date.getDate()+6)
//             Saturday = 'Y-m-d'
//               .replace('Y', date.getFullYear())
//               .replace('m', pad(date.getMonth()+1,2))
//               .replace('d', pad(date.getDate(),2))
//             console.log(WeekStart)
//             if ('undefined' == typeof Weeks[Lmap.options.type][WeekStart]) {
//                 Weeks[Lmap.options.type][WeekStart] = []
//                 weeks.push(WeekStart)
//             }
//             Weeks[Lmap.options.type][WeekStart].push(marker)
//         }
//         // let's add markers with a uniform method
//         addToMap(Lmap,All[Lmap.options.type])
// 
//         // set title for this map
//         title = L.control({ position: 'topleft' });
//         title.onAdd = function (Lmap) {
//             var div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
//             div.innerHTML = '<h5 class="map-title">'+ All[Lmap.options.type].length +" "+Titles[Lmap.options.type]+' Demos</h5>';
//             return div;
//         };
// 
//         // build wards
//         title.addTo(Lmap);
//         options += "<option>-all-</option>"
//         wards.forEach(function(idx, element) {
//             options += "<option>" + idx + "</option>"
//         })
// 
//         // set ward select for this map
//         ward_select = L.control({ position: 'topleft' })
//         ward_select.onAdd = function(Lmap) {
//             var div = L.DomUtil.create('div', 'info legend');
//             div.innerHTML = '<div class="map-select">Filter by ward:</div><select id="ward_' + Lmap.options.wardSelectId + '">' + options + '</select>'
//             div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation
//             return div
//         }
//         ward_select.addTo(Lmap)
// 
//         // build weeks
//         title.addTo(Lmap);
//         // reset options for new set
//         options = "<option>-all-</option>"
//         weeks.forEach(function(idx, element) {
//             options += "<option>" + idx + "</option>"
//         })
// 
//         // set week select for this map
//         // reset select
//         week_select = L.control({ position: 'topleft' })
//         week_select.onAdd = function(Lmap) {
//             var div = L.DomUtil.create('div', 'info legend');
//             div.innerHTML = '<div class="map-select">Filter by week:</div><select id="' + Lmap.options.weekSelectId + '">' + options + '</select>'
//             div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation
//             return div
//         }
//         week_select.addTo(Lmap)
// 
// 
//         // rewire default click and dbleclick
//         Lmap.off('click').on('click', function() {
//             var lmap=this
//             if (D.querySelectorAll(".event-panel."+lmap.options.type).length)
//                 removePanel(Panels[lmap.options.type])
//             if (lmap.getZoom() == MINZOOM) return
// 
//             // use the existing event wiring
//             $('#wards_'+lmap.options.type).change()
//         })
//         Lmap.off('dblclick').on('dblclick', function() {
//             var lmap=this
//             if (D.querySelectorAll(".event-panel."+lmap.options.type).length)
//                 removePanel(Panels[lmap.options.type])
//             if (lmap.getZoom() == MINZOOM) return
// 
//             $('#wards_'+lmap.options.type).val('-all-')
//             // use the existing event wiring
//             $('#wards_'+lmap.options.type).change()
//         })
//     }
// 
//     function addToMap(Lmap, markers) {
//         CN(arguments)
//         Active[Lmap.options.type] = markers
// 
//         Active[Lmap.options.type].forEach(function(marker) {
//             marker.addTo(Lmap)
//         })
//         focusMap(Lmap)
//     }
// 
//     function focusMap(Lmap, marker) {
//         CN(arguments)
// 
//         var FeatureGroup, markers = []
//         if (!marker) {
//             markers = Active[Lmap.options.type]
//         } else {
//             markers.push(marker)
//         }
//         if (markers.length) {
//             FeatureGroup = new L.featureGroup(markers);
//             Lmap.fitBounds(FeatureGroup.getBounds())
//         }
//     }
// 
//     function showPanel(Lmap, marker) {
//         CN(arguments)
// 
//         if (Panels[Lmap.options.type]) {
//             Panels[Lmap.options.type].remove()
//         }
//         // Panels is module-level
//         Panels[Lmap.options.type] = L.control({ position: 'bottomright' });
//         Panels[Lmap.options.type].onAdd = function(Lmap) {
//             var div = L.DomUtil.create('div', 'event-panel ' + Lmap.options.type),
//                 start = new Date(marker.options.attributes.start),
//                 end = new Date(marker.options.attributes.end),
//                 saddr = "",
//                 daddr = (marker.options.attributes.address_street + ' Philadelphia PA ' + marker.options.attributes.zip).replace(" ", "+"),
//                 title = '',
//                 url ='https://maps.google.com?saddr='
//             if (navigator.geolocation) {
//                 navigator.geolocation.getCurrentPosition(function (a) {
//                     saddr=a.coords.latitude+","+a.coords.longitude
//                 })
//             }
//             url += saddr + '&daddr=' + daddr
//             if (marker.options.attributes.display_title) {
//                 title = '<tr><td>Event:</td><td>' + marker.options.attributes.display_title + '</td></tr>'
//             } else {
//                 title = (marker.options.attributes.event_name ? '<tr><td>Event:</td><td>' + marker.options.attributes.event_name + '</td></tr>' : '' ) +
//                         (marker.options.attributes.organization_name ? '<tr><td>Organization:</td><td>' + marker.options.attributes.organization_name + '</td></tr>' : '' ) +
//                         (marker.options.attributes.location_name ? '<tr><td>Location:</td><td>' + marker.options.attributes.location_name + '</td></tr>' : '' ) 
// 
//             }
//             div.innerHTML = '<table>' +
//                 '<tr><td colspan="2">' +  months[start.getMonth()] + ' ' + start.getDate() + ', ' + start.getFullYear() + ' ' + start.getHours() % 12 + (start.getMinutes() > 0 ? ':' +('000'+start.getMinutes()).slice(-2) : '') + (start.getHours() >= 12 ? 'pm' : 'pm') + " - " + end.getHours() % 12 + (end.getMinutes() > 0 ? ':' +('000'+end.getMinutes()).slice(-2) : '') + (end.getHours() >= 12 ? 'pm' : 'pm') + '</td></tr>' +
//                 //(marker.options.attributes.title ? '<tr><td>Event:</td><td>' + marker.options.attributes.title + '</td></tr>' : '' ) +
//                 title +
//                 '<tr><td>Address:</td><td>' + marker.options.attributes.address_street + '</td></tr>' +
//                 '<tr><td colspan="2"><a href="'+url+'" target="_blank">Directions</a></td></tr>' +
//                 '</table>'
//             return div
//         }
//         Panels[Lmap.options.type].addTo(Lmap)
//     }
// 
//     function removePanel(panel) {
//         CN(arguments)
// 
//         panel.remove()
//     }
// 
//     // events
//     $(D).on('change', '#wards_future, #wards_past', function(e) {
//         var ward = $('option:selected', this).text(),
//             Lmap
//         if (LmapPast.options.wardSelectId == $(this).attr('id')) {
//             Lmap = LmapPast
//         } else {
//             Lmap = LmapFuture
//         }
//         clearMarkers(Lmap)
//         if ('-all-' == ward) {
//             addToMap(Lmap, All[Lmap.options.type])
//         } else {
//             addToMap(Lmap, Wards[Lmap.options.type][ward])
//         }
//     });
// 
//     $(D).on('click', '.event-panel', function() {
//         var Lmap
//         if ($(this).hasClass(LmapPast.options.type)) {
//             Lmap = LmapPast
//         } else {
//             Lmap = LmapFuture
//         }
// 
//         removePanel(Panels[Lmap.options.type])
//     })
// 
//     // navigation
//     $(D).on('click', '.menu-item', function () {
//         var segment = this.id.replace('menu-item-',''),
//             next=$('#container-'+segment)[0],
//             last=$('.visible')[0]
//         $(last).removeClass('visible')
//         $(last).hide()
//         $(next).show()
//         $(next).addClass('visible')
//         $(".menu-item").removeClass('is-active')
//         $(this).addClass('is-active')
//     })
//     // init
//     $(function() {
//         return
//         $('#container-usage').hide()
//         $('#container-faq').hide()
//         // Lmap(s) setup (custom options object in second param )
//         LmapPast = mapSetup('map_past', { type: 'past', iconType: 'p', wardSelectId: 'wards_past' })
//         LmapFuture = mapSetup('map_future', { type: 'future', iconType: 'f', wardSelectId: 'wards_future' })
// 
//         getMarkersPromise(Services.demos_future).then(function(data) {
//             var json = JSON.parse(data)
//             setInitialMarkers(LmapFuture, json )
//         })
// 
//         getMarkersPromise(Services.demos_past).then(function(data) {
//             var json = JSON.parse(data)
//             setInitialMarkers(LmapPast, json)
//         }).catch(function (error) {
//             console.log('error:', error)
//         }).finally(function () {
//             $('#container-demos').hide()
//             $('#menu-item-info').addClass('is-active')
//         })
// 
//     })
// 
//     W.getAll = function () {console.log('getAll',All)}
//     W.getActive = function () {console.log('getActive',Active)}
//     W.getWards = function () {console.log('getWards',Wards)}
//     W.getWeeks = function () {console.log('getWeeks',Weeks,WeekNumberRanges)}
// 
// }))
// 
// // map original code
// (function(scoped) {
//     scoped(window.jQuery, window.L, window, document)
// }(function($, L, W, D) {
//     'use strict'
//     L.Icon.Default.imagePath='assets/img'
//     var ie = /msie ([0-9]+)\.[0-9]+/.exec(navigator.userAgent.toLowerCase()),
//         DEBUG = 0,
//         GATEKEEPER_KEY = 'f2e3e82987f8a1ef78ca9d9d3cfc7f1d',
//         CITY_HALL = [39.95262, -75.16365],
//         MINZOOM = 11,
//         ZOOM = 13,
//         MAXZOOM = 18,
//         BASEMAP1 = '//tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer',
//         BASEMAP1_LABELS = '//tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer',
//         BASEMAP2 = '//services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
//         baseUri = W.baseUri,
//         Titles = {'past': 'Completed', 'future': 'Upcoming'},
//         Active = [],
//         All = [],
//         GrouperContext = [],
//         LastAddressComplete = [],
//         AllIndexes = [],
//         FeatureGroup,
//         LmapFuture,
//         LmapPast,
//         endMarker,
//         Panels = [],
//         Wards = [],
//         wardDivision,
//         searchBox,
//         divisions,
//         wards,
//         months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
//         Icons = {
//             p: L.spriteIcon('red'),
//             f: L.spriteIcon()
//         },
//         Services = {
//             demos: '//cloudapis3.philadelphiavotes.com/demos',
//             demos_past: '//cloudapis3.philadelphiavotes.com/demos/past',
//             demos_future: '//cloudapis3.philadelphiavotes.com/demos/future'
//         };
// 
//     // begin ajax functions
// 
//     function getMarkersPromise(service) {
//         // Return a new promise.
//         return new Promise(function(resolve, reject) {
//             // Do the usual XHR stuff
//             var req = new XMLHttpRequest();
//             req.open('GET', service);
// 
//             req.onload = function() {
//                 // This is called even on 404 etc
//                 // so check the status
//                 if (req.status == 200) {
//                     // Resolve the promise with the response text
//                     resolve(req.response);
//                 } else {
//                     // Otherwise reject with the status text
//                     // which will hopefully be a meaningful error
//                     reject(Error(req.statusText));
//                 }
//             };
// 
//             // Handle network errors
//             req.onerror = function() {
//                 reject(Error("Network Error"));
//             };
// 
//             // Make the request
//             req.send();
//         });
//     }
// 
//     // end ajax functions
// 
//     function setDefaultBasemaps(Lmap) {
//         CN(arguments)
//         if (BASEMAP1) {
//             L.esri.tiledMapLayer({
//                 url: BASEMAP1
//             }).addTo(Lmap)
//         }
//         if (BASEMAP1_LABELS) {
//             L.esri.tiledMapLayer({
//                 url: BASEMAP1_LABELS
//             }).addTo(Lmap)
//         }
//     }
// 
//     function clearMarkers(Lmap) {
//         CN(arguments)
// 
//         Active[Lmap.options.type].forEach(function(idx) {
//             Lmap.removeLayer(idx);
//         });
//         Active[Lmap.options.type] = []
//     }
// 
//     // end map functions
// 
//     // my utils
// 
//     // utils
//     $.support.cors = true;
// 
//     String.prototype.toProperCase = function() {
//         return this.replace(/\w\S*/g, function(a) {
//             return a.charAt(0).toUpperCase() + a.substr(1).toLowerCase();
//         });
//     };
// 
// 
// 
// 
// function getWeekNumber(d) {
//     // Copy date so don't modify original
//     d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
//     // Set to nearest Thursday: current date + 4 - current day number
//     // Make Sunday's day number 7
//     d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
//     // Get first day of year
//     var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
//     // Calculate full weeks to nearest Thursday
//     var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
//     // Return array of year and week number
//     return [d.getUTCFullYear(), weekNo];
// }
//     function pad(n, width, z) {
//         n = n + '' // cast to string
//         z = z || '0' // default padding: '0'
//         width = width || 2 // default digits: 2
//         return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
//     }
// 
//     function CN(args) {
        // 
//         if (!DEBUG) {
//             return;
//         }
//         var re = /function (.*?)\(/;
//         var s = CN.caller.toString();
//         var m = re.exec(s);
//         console.log(m[1],args.length ? args : "");
//     }
// 
//     function mapSetup(mapId, options) {
//         CN(arguments)
// 
//         D.getElementById(mapId).style.zIndex = 1
//         var Lmap = L.map(mapId, { zoomControl: false } ).setView(CITY_HALL, ZOOM)
//         Lmap.options.minZoom = MINZOOM
//         Lmap.options.maxZoom = MAXZOOM
//         Object.keys(options).forEach(function(idx) {
//             Lmap.options[idx] = options[idx]
//         })
// 
// 
//         new L.Control.Zoom({ position: 'topright' }).addTo(Lmap);
// 
//         // map events setup
//         Lmap.on('zoom', function(e) { })
// 
//         // set up layers
//         setDefaultBasemaps(Lmap)
//         //setAlternateBasemaps()
//         return Lmap;
//     }
// 
//     function setInitialMarkers(Lmap, jsn) {
//         CN(arguments)
// 
//         var ward, select, title, marker, wards = [],
//             options = ''
// 
//         // setup our 'global' arrays
//         // active 
//         Active[Lmap.options.type] = []
//         // all
//         All[Lmap.options.type] = []
//         // wards past/future (wards to be set)
//         Wards[Lmap.options.type] = []
//         // display panel(s)
//         Panels[Lmap.options.type] = null
//         for (var i = 0; i < jsn.features.length; i++) {
//             // extrapolate ward from precinct
//             ward = pad(jsn.features[i].attributes.precinct, 4).substr(0, 2)
//             marker = L.marker(jsn.features[i].coordinates, {
//                 attributes: jsn.features[i].attributes,
//                 icon: Icons[Lmap.options.iconType]
//             }).on('click', function() {
//                 // zoom into this marker (without clearing set markers)
//                 focusMap(Lmap, this)
//                 // display event panel
//                 showPanel(Lmap, this)
//             })
//             All[Lmap.options.type].push(marker)
//             if ('undefined' == typeof Wards[Lmap.options.type][ward]) {
//                 Wards[Lmap.options.type][ward] = []
//                 wards[Number(ward)] = ward
//             }
//             Wards[Lmap.options.type][ward].push(marker)
//         }
//         // let's add markers with a uniform method
//         addToMap(Lmap,All[Lmap.options.type])
//         options += "<option>-all-</option>"
//         wards.forEach(function(idx, element) {
//             options += "<option>" + idx + "</option>"
//         })
// 
//         // set title for this map
//         title = L.control({ position: 'topleft' });
//         title.onAdd = function (Lmap) {
//             var div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
//             div.innerHTML = '<h5 class="map-title">'+ All[Lmap.options.type].length +" "+Titles[Lmap.options.type]+' Demos</h5>';
//             return div;
//         };
//         title.addTo(Lmap);
// 
//         // set ward select for this map
//         select = L.control({ position: 'topleft' })
//         select.onAdd = function(Lmap) {
//             var div = L.DomUtil.create('div', 'info legend');
//             div.innerHTML = '<div class="map-select">Filter by ward:</div><select id="' + Lmap.options.selectId + '">' + options + '</select>'
//             div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation
//             return div
//         }
//         select.addTo(Lmap)
// 
//         // rewire default click and dbleclick
//         Lmap.off('click').on('click', function() {
//             var lmap=this
//             if (D.querySelectorAll(".event-panel."+lmap.options.type).length)
//                 removePanel(Panels[lmap.options.type])
//             if (lmap.getZoom() == MINZOOM) return
// 
//             // use the existing event wiring
//             $('#wards_'+lmap.options.type).change()
//         })
//         Lmap.off('dblclick').on('dblclick', function() {
//             var lmap=this
//             if (D.querySelectorAll(".event-panel."+lmap.options.type).length)
//                 removePanel(Panels[lmap.options.type])
//             if (lmap.getZoom() == MINZOOM) return
// 
//             $('#wards_'+lmap.options.type).val('-all-')
//             // use the existing event wiring
//             $('#wards_'+lmap.options.type).change()
//         })
//     }
// 
//     function addToMap(Lmap, markers) {
//         CN(arguments)
//         Active[Lmap.options.type] = markers
// 
//         Active[Lmap.options.type].forEach(function(marker) {
//             marker.addTo(Lmap)
//         })
//         focusMap(Lmap)
//     }
// 
//     function focusMap(Lmap, marker) {
//         CN(arguments)
// 
//         var FeatureGroup, markers = []
//         if (!marker) {
//             markers = Active[Lmap.options.type]
//         } else {
//             markers.push(marker)
//         }
//         if (markers.length) {
//             FeatureGroup = new L.featureGroup(markers);
//             Lmap.fitBounds(FeatureGroup.getBounds())
//         }
//     }
// 
//     function showPanel(Lmap, marker) {
//         CN(arguments)
// 
//         if (Panels[Lmap.options.type]) {
//             Panels[Lmap.options.type].remove()
//         }
//         // Panels is module-level
//         Panels[Lmap.options.type] = L.control({ position: 'bottomright' });
//         Panels[Lmap.options.type].onAdd = function(Lmap) {
//             var div = L.DomUtil.create('div', 'event-panel ' + Lmap.options.type),
//                 start = new Date(marker.options.attributes.start),
//                 end = new Date(marker.options.attributes.end),
//                 saddr = "",
//                 daddr = (marker.options.attributes.address_street + ' Philadelphia PA ' + marker.options.attributes.zip).replace(" ", "+"),
//                 title = '',
//                 url ='https://maps.google.com?saddr='
//             if (navigator.geolocation) {
//                 navigator.geolocation.getCurrentPosition(function (a) {
//                     saddr=a.coords.latitude+","+a.coords.longitude
//                 })
//             }
//             url += saddr + '&daddr=' + daddr
//             if (marker.options.attributes.display_title) {
//                 title = '<tr><td>Event:</td><td>' + marker.options.attributes.display_title + '</td></tr>'
//             } else {
//                 title = (marker.options.attributes.event_name ? '<tr><td>Event:</td><td>' + marker.options.attributes.event_name + '</td></tr>' : '' ) +
//                         (marker.options.attributes.organization_name ? '<tr><td>Organization:</td><td>' + marker.options.attributes.organization_name + '</td></tr>' : '' ) +
//                         (marker.options.attributes.location_name ? '<tr><td>Location:</td><td>' + marker.options.attributes.location_name + '</td></tr>' : '' ) 
// 
//             }
//             div.innerHTML = '<table>' +
//                 '<tr><td colspan="2">' +  months[start.getMonth()] + ' ' + start.getDate() + ', ' + start.getFullYear() + ' ' + start.getHours() % 12 + (start.getMinutes() > 0 ? ':' +('000'+start.getMinutes()).slice(-2) : '') + (start.getHours() >= 12 ? 'pm' : 'pm') + " - " + end.getHours() % 12 + (end.getMinutes() > 0 ? ':' +('000'+end.getMinutes()).slice(-2) : '') + (end.getHours() >= 12 ? 'pm' : 'pm') + '</td></tr>' +
//                 //(marker.options.attributes.title ? '<tr><td>Event:</td><td>' + marker.options.attributes.title + '</td></tr>' : '' ) +
//                 title +
//                 '<tr><td>Address:</td><td>' + marker.options.attributes.address_street + '</td></tr>' +
//                 '<tr><td colspan="2"><a href="'+url+'" target="_blank">Directions</a></td></tr>' +
//                 '</table>'
//             return div
//         }
//         Panels[Lmap.options.type].addTo(Lmap)
//     }
// 
//     function removePanel(panel) {
//         CN(arguments)
// 
//         panel.remove()
//     }
// 
//     // events
//     $(D).on('change', '#wards_future, #wards_past', function(e) {
//         var ward = $('option:selected', this).text(),
//             Lmap
//         if (LmapPast.options.selectId == $(this).attr('id')) {
//             Lmap = LmapPast
//         } else {
//             Lmap = LmapFuture
//         }
//         clearMarkers(Lmap)
//         if ('-all-' == ward) {
//             addToMap(Lmap, All[Lmap.options.type])
//         } else {
//             addToMap(Lmap, Wards[Lmap.options.type][ward])
//         }
//     });
// 
//     $(D).on('click', '.event-panel', function() {
//         var Lmap
//         if ($(this).hasClass(LmapPast.options.type)) {
//             Lmap = LmapPast
//         } else {
//             Lmap = LmapFuture
//         }
// 
//         removePanel(Panels[Lmap.options.type])
//     })
// 
//     // navigation
//     $(D).on('click', '.menu-item', function () {
//         var segment = this.id.replace('menu-item-',''),
//             next=$('#container-'+segment)[0],
//             last=$('.visible')[0]
//         $(last).removeClass('visible')
//         $(last).hide()
//         $(next).show()
//         $(next).addClass('visible')
//         $(".menu-item").removeClass('is-active')
//         $(this).addClass('is-active')
//     })
//     // init
//     $(function() {
//         return;
//         $('#container-usage').hide()
//         $('#container-faq').hide()
//         // Lmap(s) setup (custom options object in second param )
//         LmapPast = mapSetup('map_past', { type: 'past', iconType: 'p', selectId: 'wards_past' })
//         LmapFuture = mapSetup('map_future', { type: 'future', iconType: 'f', selectId: 'wards_future' })
// 
//         getMarkersPromise(Services.demos_future).then(function(data) {
//             var json = JSON.parse(data)
//             setInitialMarkers(LmapFuture, json )
//         })
// 
//         getMarkersPromise(Services.demos_past).then(function(data) {
//             var json = JSON.parse(data)
//             setInitialMarkers(LmapPast, json)
//         }).catch(function (error) {
//             console.log('error:', error)
//         }).finally(function () {
//             $('#container-demos').hide()
//             $('#menu-item-info').addClass('is-active')
//         })
// 
//     })
// 
//     W.getAll = function () {console.log('getAll',All)}
//     W.getActive = function () {console.log('getActive',Active)}
//     W.getWards = function () {console.log('getWards',Wards)}
// 
// }))
// 
// 
