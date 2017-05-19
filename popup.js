var _request_header = [];
var _request_index = 0;;
var bindWebRequestListener;
var bindPageUpdatedListener;;

$( document ).ready(function() {

    $('#start').on('click', function() {
        $('tbody').html('');
        showLoadingPage();
        $(this).attr('disabled', true);
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.update(tabs[0].id, {url: tabs[0].url}, function(){
                console.log('do update callback');
            });
        });

        if (typeof bindWebRequestListener == 'undefined') {
    //        console.log('bindWebRequest is undefined');
            bindPageUpdatedListener = function() {
                console.log('page updated!!');
                console.log('=======================================');
                chrome.tabs.onUpdated.addListener(webUpdatedCallback);
            }

            bindWebRequestListener = function() {
                chrome.webRequest.onCompleted.addListener(webRequestCallback, {
                    urls: [
                        "<all_urls>"
                    ]
                }, ["responseHeaders"]);
            };

            bindWebRequestListener();
            bindPageUpdatedListener();
        }

        $(this).attr('disabled', false);
    });

});

var showLoadingPage = function(){
    $('.bg').show();
    $('.bg').css('overflow', 'hidden');
}
var hideLoadingPage = function(){
    $('.bg').hide();
    $('.bg').css('overflow', 'visible');
}

var webUpdatedCallback = function(tabId , info) {
    if (info.status == "complete") {
        console.log('web updated done!');
        createHtml(_request_header);
    }
}

var webRequestCallback = function(details) {
    console.log('web request loading listener');
    _request_header[_request_index] = details;
    $('#reques_num').text(_request_index + 1);
    _request_index++;
}

var createHtml = function (requests){
    var reg;
    var return_msg = [];
    var is_fbjs_suc = false;
    var is_fbpageview_suc = false;
    var is_fbMicrodata_suc = false;
    var fb_id = '';
    var query_string = '';

    var is_gapageview_suc = false;
    var is_gajs_suc = false;
    var ga_id = '';

    var is_adjs_suc = false;
    var ad_id = '';

    var gtm = [];
    var gtm_datahub = [];
    var collect = [];

    requests.forEach(function(obj){
        var parser = document.createElement('a');
        parser.href = obj.url;
        query_string = getJsonFromUrl(parser.search);

        if (obj.url.match(/www\.googletagmanager\.com\/gtm\.js/g) && obj.statusCode == 200) {
            gtm.push(query_string['id']);
        }else if (obj.url.match(/www\.googleadservices\.com\/pagead\/(conversion|conversion_async)\.js/g) && obj.statusCode == 200) {
            is_adjs_suc = true;
        } else if (obj.url.match(/www\.google-analytics\.com\/analytics\.js/g) && obj.statusCode == 200) {
            is_gajs_suc = true;
        } else if (obj.url.match(/connect\.facebook\.net\/en_US\/fbevents\.js/g) && obj.statusCode == 200) {
            is_fbjs_suc = (obj.statusCode == 200) ? true : false;
        } else if (obj.url.match(/https:\/\/www\.facebook\.com\/tr\/\?.*/g)  && obj.statusCode == 200) {
            if (query_string['id']) {
                fb_id = query_string['id'];
            }

            if (query_string['ev'] == 'PageView' && obj.statusCode == 200) {
                is_fbpageview_suc = true;
            }

            if (query_string['ev'] == 'Microdata' && obj.statusCode == 200) {
                is_fbMicrodata_suc = true;
            }

        } else if (obj.url.match(/www\.google-analytics\.com\/collect\?/g)) {
            if (query_string['tid']  && obj.statusCode == 200) {
                ga_id = query_string['tid'];
                is_gapageview_suc = true;
            }

            if (query_string['gtm'] && query_string['tid'] && obj.statusCode == 200) {
                collect.push({'tid': query_string['tid'], 'gtm': query_string['gtm']});
            }

        } else if (obj.url.match(/stats\.g\.doubleclick\.net\/r\/collect\?/g)) {
            if (query_string['tid']  && obj.statusCode == 200) {
                ga_id = query_string['tid'];
                is_gapageview_suc = true;
            }
        } else if (obj.url.match(/www\.google\.com\.tw\/ads\/user-lists\/([0-9]+)\/\?random*/g) &&
        obj.statusCode == 200) {
            ad_id = obj.url.match(/(\d+)/i)[0];
            is_adpageview_suc = true;
        } else if (obj.url.match(/in\.datahub\.events\/\w+\?/g) &&
        obj.statusCode == 200) {
            gtm_datahub.push(query_string['gtm']);
        }
    });

    appendGtmTr({
        gtm:gtm,
        gtm_datahub:gtm_datahub,
        collect:collect
    });

    appendFbTr({
        is_js_suc:is_fbjs_suc,
        is_pageview_suc:is_fbpageview_suc,
        is_Microdata_suc:is_fbMicrodata_suc,
        id:fb_id
    });

    appendAdTr({
        is_js_suc:is_adjs_suc,
        id:ad_id
    });

    appendGaTr({
        is_js_suc:is_gajs_suc,
        is_pageview_suc:is_gapageview_suc,
        id:ga_id
    });

    _request_header = [];
    _request_index = 0;

    chrome.webRequest.onCompleted.removeListener(webRequestCallback);
    chrome.tabs.onUpdated.removeListener(webUpdatedCallback);
    //  console.log('webRequest reseting!!!');
    bindWebRequestListener = undefined;
    bindPageUpdatedListener = undefined;
    hideLoadingPage();
}

var appendGtmTr = function(ret) {
    var _table = document.getElementById("gtmtable").tBodies[0];

    console.log(ret);
    ret.gtm.forEach(function(value, index) {
        var item = [];
        item['gid'] = value;
        item['data'] = false;
        item['tid'] = false;

        ret.gtm_datahub.forEach(function(gvalue, gindex) {
            if (value == gvalue) {
                item['data'] = true;
            }
        });

        ret.collect.forEach(function(cvalue, cindex) {
            if (cvalue['gtm'] == value) {
                item['tid'] = cvalue['tid'];
            }
        });
        var _row = _table.insertRow(_table.rows.length);
        var cell1 = _row.insertCell(0);
        var cell2 = _row.insertCell(1);
        var cell3 = _row.insertCell(2);

        if (! item['gid']) {
            gtm_dom = getFailImg();
        } else {
            gtm_dom = document.createTextNode(item['gid']);
        }

        if (! item['tid']) {
            ga_dom = getFailImg();
        } else {
            ga_dom = document.createTextNode(item['tid']);
        }


        if (! item['data']) {
            gtm_datahub_dom = getFailImg();
        } else {
            gtm_datahub_dom = getSuccessImg();
        }

        cell1.appendChild(gtm_dom);
        cell2.appendChild(ga_dom);
        cell3.appendChild(gtm_datahub_dom);
    });
}

var appendAdTr = function(ret){
    var _table = document.getElementById("adtable").tBodies[0];

    var _row = _table.insertRow(_table.rows.length);
    var cell1 = _row.insertCell(0);
    var cell2 = _row.insertCell(1);

    var id_dom,
    jf_dom;

    if (ret.id == '') {
        id_dom = getFailImg();
    } else {
        id_dom = document.createTextNode(ret.id);
    }

    if (ret.is_js_suc) {
        jf_dom = getSuccessImg();
    } else {
        jf_dom = getFailImg();
    }

    cell1.appendChild(id_dom);
    cell2.appendChild(jf_dom);
}

var appendGaTr = function(ret){
    var _table = document.getElementById("gatable").tBodies[0];

    var _row = _table.insertRow(_table.rows.length);
    var cell1 = _row.insertCell(0);
    var cell2 = _row.insertCell(1);
    var cell3 = _row.insertCell(2);

    var id_dom,
    pv_dom,
    jf_dom;

    if (ret.id == '') {
        id_dom = getFailImg();
    } else {
        id_dom = document.createTextNode(ret.id);
    }

    if (ret.is_pageview_suc) {
        pv_dom = getSuccessImg();
    } else {
        pv_dom = getFailImg();
    }

    if (ret.is_js_suc) {
        jf_dom = getSuccessImg();
    } else {
        jf_dom = getFailImg();
    }

    cell1.appendChild(id_dom);
    cell2.appendChild(pv_dom);
    cell3.appendChild(jf_dom);
}

var appendFbTr = function(ret){
    var _table = document.getElementById("fbtable").tBodies[0];

    var _row = _table.insertRow(_table.rows.length);
    var cell1 = _row.insertCell(0);
    var cell2 = _row.insertCell(1);
//    var cell3 = _row.insertCell(2);
    var cell4 = _row.insertCell(2);

    var id_dom,
    pv_dom,
    ms_dom,
    jf_dom;

    if (ret.id == '') {
        id_dom = getFailImg();
    } else {
        id_dom = document.createTextNode(ret.id);
    }

    if (ret.is_pageview_suc) {
        pv_dom = getSuccessImg();
    } else {
        pv_dom = getFailImg();
    }

    if (ret.is_Microdata_suc) {
        ms_dom = getSuccessImg();
    } else {
        ms_dom = getFailImg();
    }

    if (ret.is_js_suc) {
        jf_dom = getSuccessImg();
    } else {
        jf_dom = getFailImg();
    }

    cell1.appendChild(id_dom);
    cell2.appendChild(pv_dom);
  //  cell3.appendChild(ms_dom);
    cell4.appendChild(jf_dom);
}

var getSuccessImg = function(){
    var img = document.createElement('img');
    img.src = "images/1495106873_Tick_Mark_Dark.png";
    img.width = '20';

    return img;
}

var getFailImg = function(){
    var img = document.createElement('img');
    img.src = "images/1495106894_Close_Icon.png";
    img.width = '20';

    return img;
}

var createList = function(search_str) {
    var list = document.createElement('ul');
    for(var index in search_str) { 
        if (index == '') {
            continue;
        }
        var item = document.createElement('li');
        item.appendChild(document.createTextNode(index + ' : ' + search_str[index]));
        list.appendChild(item);
    }

    return list;
}

var getJsonFromUrl = function (url_search){
    var query = url_search.substr(1);
    var result = {};
    query.split("&").forEach(function(part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
    });
    return result;
}
