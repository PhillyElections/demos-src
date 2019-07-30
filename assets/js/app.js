import $ from 'jquery';
import 'what-input';

// Foundation JS relies on a global varaible. In ES6, all imports are hoisted
// to the top of the file so if we used`import` to import Foundation,
// it would execute earlier than we have assigned the global variable.
// This is why we have to use CommonJS require() here since it doesn't
// have the hoisting behavior.
window.jQuery = $;
require('foundation-sites');

// If you want to pick and choose which modules to include, comment out the above and uncomment
// the line below
//import './lib/foundation-explicit-pieces';

// map code
(function(scoped) {
    scoped(window.jQuery, window.L, window, document)
}(function($, L, W, D) {
    'use strict'
    L.Icon.Default.imagePath = 'assets/img'
    var ie = /msie ([0-9]+)\.[0-9]+/.exec(navigator.userAgent.toLowerCase()),
        DEBUG = 0,
        GATEKEEPER_KEY = 'f2e3e82987f8a1ef78ca9d9d3cfc7f1d',
        CITY_HALL = [39.95262, -75.16365],
        MINZOOM = 11,
        ZOOM = 13,
        MAXZOOM = 18,
        BASEMAP1 = 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap/MapServer',
        BASEMAP1_LABELS = 'https://tiles.arcgis.com/tiles/fLeGjb7u4uXqeF9q/arcgis/rest/services/CityBasemap_Labels/MapServer',
        BASEMAP2 = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer',
        Titles = { 'past': 'Completed', 'future': 'Upcoming' },
        Active = [],
        LmapFuture,
        LmapPast,
        Panels = [],
        Addresses = [],
        months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
        Icons = {
            p: L.spriteIcon('red'),
            f: L.spriteIcon()
        },
        Services = {
            demos: 'https://cloudapis3.philadelphiavotes.com/demos',
            demos_past: 'https://cloudapis3.philadelphiavotes.com/demos/past',
            demos_future: 'https://cloudapis3.philadelphiavotes.com/demos/future'
        };

    // begin ajax functions

    function getMarkersPromise(service) {
        // Return a new promise.
        return new Promise(function(resolve, reject) {
            // Do the usual XHR stuff
            var req = new XMLHttpRequest();
            req.open('GET', service);

            req.onload = function() {
                // This is called even on 404 etc
                // so check the status
                if (req.status == 200) {
                    // Resolve the promise with the response text
                    resolve(req.response);
                } else {
                    // Otherwise reject with the status text
                    // which will hopefully be a meaningful error
                    reject(Error(req.statusText));
                }
            };

            // Handle network errors
            req.onerror = function() {
                reject(Error("Network Error"));
            };

            // Make the request
            req.send();
        });
    }

    // end ajax functions

    // start map functions

    function setDefaultBasemaps(Lmap) {

        if (BASEMAP1) {
            L.esri.tiledMapLayer({
                url: BASEMAP1
            }).addTo(Lmap)
        }
        if (BASEMAP1_LABELS) {
            L.esri.tiledMapLayer({
                url: BASEMAP1_LABELS
            }).addTo(Lmap)
        }
    }

    function clearMarkers(Lmap) {
        DEBUG ? console.log('clearMarkers') : ''

        Active[Lmap.options.type].forEach(function(idx) {
            Lmap.removeLayer(idx);
        });
        Active[Lmap.options.type] = []
    }

    function mapSetup(mapId, options) {
        DEBUG ? console.log('mapSetup') : ''

        D.getElementById(mapId).style.zIndex = 1
        var Lmap = L.map(mapId, { zoomControl: false }).setView(CITY_HALL, ZOOM)
        Lmap.options.minZoom = MINZOOM
        Lmap.options.maxZoom = MAXZOOM
        Object.keys(options).forEach(function(idx) {
            Lmap.options[idx] = options[idx]
        })

        new L.Control.Zoom({ position: 'topright' }).addTo(Lmap);

        // map events setup
        Lmap.on('zoom', function(e) {})

        // set up layers
        setDefaultBasemaps(Lmap)

        return Lmap;
    }

    function setInitialMarkers(Lmap, jsn) {
        DEBUG ? console.log('setInitialMarkers') : ''

        var addresses = [],
            ward, link, select, title, marker, row_obj, wards = [],
            options = '',
            start, end, date_start, date_end

        // setup our 'global' arrays
        // active 
        Active[Lmap.options.type] = []
        // by Address
        Addresses[Lmap.options.type] = []
        // display panel(s)
        Panels[Lmap.options.type] = null
        //
        Lmap.options.csv_array = []
        Lmap.options.total = jsn.features.length
        W.start = jsn.features[0].attributes.start
            console.log(jsn.features[0].attributes.start)

        for (var i = 0; i < jsn.features.length; i++) {
            ward = pad(jsn.features[i].attributes.precinct, 4).substr(0, 2)
            // instantiate array segment if needed
            if ('undefined' == typeof addresses[ward + '|' + jsn.features[i].attributes.address_street]) {
                addresses[ward + '|' + jsn.features[i].attributes.address_street] = []
            }
            if ('undefined' == typeof wards[Number(ward)]) {
                wards[Number(ward)] = ward
            }
            addresses[ward + '|' + jsn.features[i].attributes.address_street].push(jsn.features[i])

            // refresh array
            row_obj = []
            start = jsn.features[i].attributes.start
            end = jsn.features[i].attributes.end

            var date_start = new Date(start.substr(0, 4), start.substr(5, 2)-1, start.substr(8, 2), start.substr(11, 2), start.substr(14, 2), start.substr(17, 2))
            date_end = new Date(end.substr(0, 4), end.substr(5, 2)-1, end.substr(8, 2), end.substr(11, 2), end.substr(14, 2), end.substr(17, 2))

            row_obj.day = getFormattedDate(date_start)
            row_obj.start = getFormattedTime(date_start)
            row_obj.end = getFormattedTime(date_end)
            row_obj.address = jsn.features[i].attributes.address_street
            row_obj.zip = jsn.features[i].attributes.zip

            // let's built and push out CSV export rows
            if (jsn.features[i].attributes.display_title) {
                row_obj.event = jsn.features[i].attributes.display_title
            } else if (jsn.features[i].attributes.event_name) {
                row_obj.event = jsn.features[i].attributes.event_name
            } else if (jsn.features[i].attributes.location_name) {
                row_obj.event = jsn.features[i].attributes.location_name
            } else {
                row_obj.event = jsn.features[i].attributes.organization_name
            }
            Lmap.options.csv_array.push(row_obj)

        }
        Object.keys(addresses).forEach(function(idx) {
            var attributes = [],
                coordinates
            coordinates = addresses[idx][0].coordinates
            for (var i = 0; i < addresses[idx].length; i++) {
                attributes.push(addresses[idx][i].attributes)
            }
            marker = L.marker(coordinates, {
                attributes: attributes,
                icon: Icons[Lmap.options.iconType]
            }).on('click', function() {
                // zoom into this marker (without clearing set markers)
                focusMap(Lmap, this)
                // display event panel
                showPanel(Lmap, this)
            })

            if ('undefined' == typeof Addresses[Lmap.options.type][idx]) {
                Addresses[Lmap.options.type][idx] = []
            }
            Addresses[Lmap.options.type][idx].push(marker)
        })

        // let's add markers with a uniform method
        addToMap(Lmap, Addresses[Lmap.options.type])
        options += "<option>-all-</option>"
        wards.forEach(function(idx, element) {
            options += "<option>" + idx + "</option>"
        })

        link = L.control({ position: 'bottomleft' });
        link.onAdd = function(Lmap) {
            var div = L.DomUtil.create('div', 'leaflet-control-attribution'); // create a div with a class "info"
            div.innerHTML = '<a id="' + Lmap.options.type + '_download">Download CSV</a>';
            return div;
        };
        link.addTo(Lmap);

        // set title for this map
        title = L.control({ position: 'topleft' });
        title.onAdd = function(Lmap) {
            var div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            div.innerHTML = '<h5 class="map-title">' + Lmap.options.total + " " + Titles[Lmap.options.type] + ' Demos</h5>';
            return div;
        };
        title.addTo(Lmap);

        // set ward select for this map
        select = L.control({ position: 'topleft' })
        select.onAdd = function(Lmap) {
            var div = L.DomUtil.create('div', 'info legend');
            div.innerHTML = '<div class="map-select">Filter by ward:</div><select id="' + Lmap.options.selectId + '">' + options + '</select>'
            div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation
            return div
        }
        select.addTo(Lmap)

        // rewire default click and dbleclick
        clearNativeMapEvents(Lmap)
        setCustomMapEvents(Lmap)
    }

    function addToMap(Lmap, markers) {
        DEBUG ? console.log('addToMap') : ''

        Object.keys(markers).forEach(function(idx) {
            for (var i = 0; i < markers[idx].length; i++) {
                Active[Lmap.options.type].push(markers[idx][i])
                markers[idx][i].addTo(Lmap)
            }
        })
        focusMap(Lmap)
    }

    function focusMap(Lmap, marker) {
        DEBUG ? console.log('focusMap') : ''

        var FeatureGroup, markers = []
        if (!marker) {
            markers = Active[Lmap.options.type]
        } else {
            markers.push(marker)
        }

        if (markers.length) {
            FeatureGroup = new L.featureGroup(markers);
            Lmap.fitBounds(FeatureGroup.getBounds())
        }
    }

    function writeCSVLink(Lmap) {
        DEBUG ? console.log('writeCSVLink') : ''
        var csv_array = Lmap.options.csv_array,
            content = "data:text/csv;charset=utf-8,"

        // yes, this is intended to be embedded
        function obj2CSVRow(dataObject) {
            var dataArray = new Array;
            for (var o in dataObject) {
                var innerValue = dataObject[o] === null ? '' : dataObject[o].toString();
                var result = innerValue.replace(/"/g, '""');
                result = '"' + result + '"';
                dataArray.push(result);
            }
            return dataArray.join(',') + '\r\n';
        }

        // column headers
        content += obj2CSVRow(Object.keys(csv_array[0]));

        //rows
        Object.keys(csv_array).forEach(function(item) {
            content += obj2CSVRow(csv_array[item]);
        });

        var encodedUri = encodeURI(content);
        var link = D.getElementById(Lmap.options.type + '_download')
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", Lmap.options.type + "_events.csv");
    }

    function showPanel(Lmap, marker) {
        DEBUG ? console.log('showPanel') : ''
        var saddr = ''
        if (Panels[Lmap.options.type]) {
            Panels[Lmap.options.type].remove()
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(a) {
                saddr = a.coords['latitude'] + "," + a.coords['longitude']
                writePanel()
            }, writePanel, { timeout: 500 })
        }

        // yes, this is intended to be embedded
        function writePanel() {
            Panels[Lmap.options.type] = L.control({ position: 'bottomright' });
            Panels[Lmap.options.type].onAdd = function(Lmap) {
                var div = L.DomUtil.create('div', 'event-panel ' + Lmap.options.type),
                    date = '',
                    dates = '',
                    dates_short = '',
                    dates_html = '',
                    daddr = marker.options.attributes[0].street_name,
                    title = '',
                    url = 'https://maps.google.com?saddr='
                for (var i = 0; i < marker.options.attributes.length; i++) {
                    var start = marker.options.attributes[i].start,
                        end = marker.options.attributes[i].end,
                        date_start = new Date(start.substr(0, 4), start.substr(5, 2)-1, start.substr(8, 2), start.substr(11, 2), start.substr(14, 2), start.substr(17, 2)),
                        date_end = new Date(end.substr(0, 4), end.substr(5, 2)-1, end.substr(8, 2), end.substr(11, 2), end.substr(14, 2), end.substr(17, 2))
                    if (dates.length) {
                        date = ', '
                    }
                    date += (getFormattedDate(date_start) + " " + getFormattedTime(date_start, date_end)).replace(' ', '&nbsp;')
                    if (i < 8) {
                        dates_short += date
                    }
                    dates += date
                }

                dates_html = '<span class="less">' + dates_short + (dates.length == dates_short.length ? '' : ' <span class="show-more">(Click &apos;Download CSV&apos; below to view all)</span>') + '</span>'
                if (dates.length != dates.length) {
                    dates_html += '<span class="more hidden">' + dates + ' <span class="show-less">(less...)</span></span>'
                }
                daddr = (marker.options.attributes[0].address_street + ' Philadelphia PA ' + marker.options.attributes[0].zip).replace(" ", "+")
                saddr = saddr ? saddr : 'My%20Location'
                url += saddr + '&daddr=' + daddr
                if (marker.options.attributes[0].display_title) {
                    title = '<tr><td>Event:</td><td>' + marker.options.attributes[0].display_title + '</td></tr>'

                } else {
                    title = (marker.options.attributes[0].event_name ? '<tr><td>Event:</td><td>' + marker.options.attributes[0].event_name + '</td></tr>' : '') +
                        (marker.options.attributes[0].organization_name ? '<tr><td>Organization:</td><td>' + marker.options.attributes[0].organization_name + '</td></tr>' : '') +
                        (marker.options.attributes[0].location_name ? '<tr><td>Location:</td><td>' + marker.options.attributes[0].location_name + '</td></tr>' : '')

                }
                div.innerHTML = '<table>' +
                    '<tr><td>Dates:</td><td colspan="2">' + dates_html + '</td></tr>' +
                    (marker.options.attributes[0].title ? '<tr><td>Event:</td><td>' + marker.options.attributes[0].title + '</td></tr>' : '') +
                    title +
                    '<tr><td>Address:</td><td>' + marker.options.attributes[0].address_street + '</td></tr>' +
                    '<tr><td colspan="2"><a href="' + url + '" target="_blank">Directions</a></td></tr>' +
                    '</table>'
                return div
            }
            Panels[Lmap.options.type].addTo(Lmap)
        }

    }

    function removePanel(panel) {
        DEBUG ? console.log('removePanel') : ''

        panel.remove()
    }

    // end map functions

    // my utils

    // utils
    $.support.cors = true;

    function getFormattedDate(start) {
        DEBUG ? console.log('getFormattedDate') : ''
        var value = 'M d, Y'
            .replace('M', months[start.getMonth()])
            .replace('d', start.getDate())
            .replace('Y', start.getFullYear())
        return value
    }

    //    Note:  getFormattedTime is not a generalized time formatting function due to one assumption:
    //    ...any midnight (hour) time is taken to mean "TBA" regardless of minutes    
    function getFormattedTime(start, end) {
        DEBUG ? console.log('getFormattedTime') : ''
        if (!start) {
            return false
        }
        if (start && end) {
            return 'sT - eT'
                .replace('sT', (start.getHours() == 0 ? "TBA" :
                    ((start.getHours() > 12 ? (start.getHours() % 12) : start.getHours()) +
                        (start.getMinutes() > 0 ? ':' + ('000' + start.getMinutes()).slice(-2) : '')
                    ) +
                    (start.getHours() >= 12 ? ' pm' : ' am')

                ))
                .replace('eT', (end.getHours() == 0 ? "TBA" :
                    ((end.getHours() > 12 ? (end.getHours() % 12) : end.getHours()) +
                        (end.getMinutes() > 0 ? ':' + ('000' + end.getMinutes()).slice(-2) : '')
                    ) +
                    (end.getHours() >= 12 ? ' pm' : ' am')
                ))
        }
        return 'sT'
            .replace('sT', (start.getHours() == 0 ? "TBA" :
                ((start.getHours() > 12 ? (start.getHours() % 12) : start.getHours()) +
                    (start.getMinutes() > 0 ? ':' + ('000' + start.getMinutes()).slice(-2) : '')
                ) +
                (start.getHours() >= 12 ? ' pm' : ' am')

            ))
    }

    function pad(n, width, z) {
        n = n + '' // cast to string
        z = z || '0' // default padding: '0'
        width = width || 2 // default digits: 2
        return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
    }

    function clearNativeMapEvents(Lmap) {
        Lmap.off('click')
        Lmap.off('dblclick')
    }

    function setCustomMapEvents(Lmap) {
        Lmap.on('click', clickLmap)
        Lmap.on('dblclick', dblClickLmap)
    }
    // events

    function clickLmap() {
        DEBUG ? console.log('clickLmap') : ''
        var lmap = this

        if (D.querySelectorAll(".event-panel." + lmap.options.type).length)
            removePanel(Panels[lmap.options.type])
        if (lmap.getZoom() == MINZOOM) return

        // use the existing event wiring
        $('#wards_' + lmap.options.type).change()
    }

    function dblClickLmap() {
        DEBUG ? console.log('dblClickLmap') : ''
        var lmap = this
        if (D.querySelectorAll(".event-panel." + lmap.options.type).length)
            removePanel(Panels[lmap.options.type])
        if (lmap.getZoom() == MINZOOM) return

        $('#wards_' + lmap.options.type).val('-all-')
        // use the existing event wiring
        $('#wards_' + lmap.options.type).change()
    }

    function showMore() {
        DEBUG ? console.log('clickEventPanelLink') : ''
        var $this = $(this),
            $parent = $this.parent(),
            $next = $parent.next()


        if ($next.hasClass('hidden')) {
            $next.hide()
            $next.removeClass('hidden')

        }
        $(D).off('mouseover', '.event-panel .show-less')
        $parent.hide(100)
        $next.slideDown(100)
        setTimeout(function() { $(D).on('mouseover', '.event-panel .show-less', showLess) }, 500)
    }

    function showLess() {
        DEBUG ? console.log('clickEventPanelLink') : ''
        var $this = $(this),
            $parent = $this.parent(),
            $previous = $parent.prev()


        $(D).off('mouseover', '.event-panel .show-more')
        $parent.hide(100)
        $previous.slideDown(100)
        setTimeout(function() { $(D).on('mouseover', '.event-panel .show-more', showMore) }, 500)
    }

    function clickMenuItem() {
        DEBUG ? console.log('clickMenuItem') : ''
        var segment = this.id.replace('menu-item-', ''),
            $next = $($('#container-' + segment)[0]),
            $last = $($('.visible')[0])
        // don't navigate if no navigation
        if ($next[0].id == $last[0].id) {
            return
        }
        $last.removeClass('visible')
        $last.slideUp(100)
        $next.slideDown(100)
        $next.addClass('visible')
        $(".menu-item").removeClass('is-active')
        $(this).addClass('is-active')
        if ($("#menu-right").hasClass("vertical")) {
            $("#top-bar").foundation('toggleMenu');
        }
    }

    function changeWardsOption() {
        DEBUG ? console.log('changeWardsOption') : ''
        var ward = $('option:selected', this).text(),
            Lmap,
            ward_markers = []
        if (LmapPast.options.selectId == $(this).attr('id')) {
            Lmap = LmapPast
        } else {
            Lmap = LmapFuture
        }
        clearMarkers(Lmap)
        if (ward == '-all-') {
            addToMap(Lmap, Addresses[Lmap.options.type])
        } else {
            Object.keys(Addresses[Lmap.options.type]).forEach(function(idx) {
                if (ward == idx.substr(0, 2)) {
                    ward_markers.push(Addresses[Lmap.options.type][idx])
                }
            })
            addToMap(Lmap, ward_markers)
        }
    }

    // event hooks

    // backign out of show-more show-less for an incremental release
    //$(D).on('mouseover', '.event-panel .show-more', showMore)

    //$(D).on('mouseover', '.event-panel .show-less', showLess)

    $(D).on('click', '.menu-item', clickMenuItem)

    $(D).on('change', '#wards_future, #wards_past', changeWardsOption);

    // init
    $(function() {

        $(D).foundation();

        if (Foundation.MediaQuery.atLeast('medium')) {
            $("#menu-right").removeClass("vertical")
            //$("#top-menu").slideUp(500)
        }


        $('#container-usage').hide()
        $('#container-faq').hide()
        // Lmap(s) setup (custom options object in second param )
        LmapPast = mapSetup('map_past', { type: 'past', iconType: 'p', selectId: 'wards_past' })
        LmapFuture = mapSetup('map_future', { type: 'future', iconType: 'f', selectId: 'wards_future' })

        getMarkersPromise(Services.demos_future).then(function(data) {
            var json = JSON.parse(data)
            setInitialMarkers(LmapFuture, json)
        }).catch(function(error) {
            console.log('error:', error)
        }).finally(function() {
            writeCSVLink(LmapFuture)
        })

        getMarkersPromise(Services.demos_past).then(function(data) {
            var json = JSON.parse(data)
            setInitialMarkers(LmapPast, json)
        }).catch(function(error) {
            console.log('error:', error)
        }).finally(function() {
            writeCSVLink(LmapPast)
            $('#container-demos').hide()
            $('#menu-item-info').addClass('is-active')
            if (navigator.geolocation) {
                setTimeout(function() {
                    navigator.geolocation.getCurrentPosition(function(a) {
                        // success.  do nothing.
                    }, function() {
                        console.log("initial geolocation failed")
                    }, { timeout: 500 })
                }, 1000)
            }
        })

    })
    W.Lmap = []
    W.Lmap.getActive = function() { console.log('getActive', Active) }
    W.Lmap.getAddresses = function() { console.log('getAddresses', Addresses) }
}))