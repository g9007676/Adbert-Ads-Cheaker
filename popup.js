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
var hidealltbode = function() {
    $('.panel-body').hide();
}

var showalltbode = function() {
    $('.panel-body').show();
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

    var is_fbjs_suc = null;

    var fb = [];
    var query_string = '';

    var is_gapageview_suc = false;
    var is_gajs_suc = null;
    var ga = [];

    var is_adjs_suc = null;
    var ad = [];

    var gtm = [];
    var gtm_datahub = [];
    var collect = [];

    var atm = [];

    requests.forEach(function(obj){
        var parser = document.createElement('a');
        parser.href = obj.url;
        query_string = getJsonFromUrl(parser.search);

        // ATM
        if (obj.url.match(/\/\/stg-d\.adbert\.com\.tw\/analytics\.js/g)) {
            if (obj.statusCode == 200) {
                atm.push({'aid': query_string['id'], 'ret' : true});
            } else {
                atm.push({'aid': query_string['id'], 'ret' : false});
            }
        }

        //GTM
        if (obj.url.match(/www\.googletagmanager\.com\/gtm\.js/g)) {
            if (obj.statusCode == 200) {
                gtm.push({'gtm': query_string['id'], 'ret' : true});
            } else {
                gtm.push({'gtm': query_string['id'], 'ret' : false});
            }
        }

        //adword js
        if (obj.url.match(/www\.googleadservices\.com\/pagead\/(conversion|conversion_async)\.js/g)) {
            if (obj.statusCode == 200) {
                is_adjs_suc = true;
            } else {
                is_adjs_suc = false;
            }
        }

        //GA JS FILE
        if (obj.url.match(/www\.google-analytics\.com\/analytics\.js/g)) {

            if (obj.statusCode == 200) {
                is_gajs_suc = true;
            } else {
                is_gajs_suc = false;
            }
        }

        if (obj.url.match(/connect\.facebook\.net\/en_US\/fbevents\.js/g)) {
            is_fbjs_suc = (obj.statusCode == 200) ? true : false;
        }

        if (obj.url.match(/https:\/\/www\.facebook\.com\/tr\/\?.*/g)) {

            if (obj.statusCode == 200) {
                fb.push({'fid': query_string['id'], 'ret' : true, 'ev' : query_string['ev']});
            } else {
                fb.push({'fid': query_string['id'], 'ret' : false, 'ev' : query_string['ev']});
            }
        }


        // GA
        if (obj.url.match(/www\.google-analytics\.com\/collect\?/g)) {

            if (obj.statusCode == 200) {
                ga.push({'gaid': query_string['tid'], 'ret' : true});
            } else {
                ga.push({'gaid': query_string['tid'], 'ret' : false});
            }

            if (query_string['gtm'] && query_string['tid']) {
                if (obj.statusCode == 200) {
                    collect.push({'tid': query_string['tid'], 'gtm': query_string['gtm'], 'ret': true});
                } else {
                    collect.push({'tid': query_string['tid'], 'gtm': query_string['gtm'], 'ret': false});
                }
            }
        }

        if (obj.url.match(/stats\.g\.doubleclick\.net\/r\/collect\?/g)) {
            if (obj.statusCode == 200) {
                ga.push({'gaid': query_string['tid'], 'ret' : true});
            } else {
                ga.push({'gaid': query_string['tid'], 'ret' : false});
            }
        }
        if (obj.url.match(/www\.google\.com\.tw\/ads\/user-lists\/([0-9]+)\/\?random*/g)) {
            var ad_id = obj.url.match(/(\d+)/i)[0];

            if (obj.statusCode == 200) {
                ad.push({'adid': ad_id, 'ret' : true});
            } else {
                ad.push({'adid': ad_id, 'ret' : false});
            }
        }

        //暫時不使用
       // if (obj.url.match(/in\.datahub\.events\/\w+\?/g)) {
       //     if (obj.statusCode == 200) {
       //         gtm_datahub.push({'gtm': query_string['gtm'], 'ret' : true});
       //     } else {
       //         gtm_datahub.push({'gtm': query_string['gtm'], 'ret' : false});
       //     }
       // }
    });
    showalltbode();

    appendAtmTr({
        atm:atm
    });

    appendGtmTr({
        gtm:gtm,
//        gtm_datahub:gtm_datahub,
        collect:collect
    });

    appendFbTr({
        is_js_suc:is_fbjs_suc,
        fb:fb
    });

    appendAdTr({
        is_js_suc:is_adjs_suc,
        ad:ad
    });

    appendGaTr({
        is_js_suc:is_gajs_suc,
        ga:ga
    });

    _request_header = [];
    _request_index = 0;

    chrome.webRequest.onCompleted.removeListener(webRequestCallback);
    chrome.tabs.onUpdated.removeListener(webUpdatedCallback);

    bindWebRequestListener = undefined;
    bindPageUpdatedListener = undefined;
    hideLoadingPage();
}

var hideTable = function(table_name, title_name){
    var _table_dom = $('#' + table_name);
    var _title_dom = $('#' + title_name);
    _table_dom.parents('.panel-body').hide();
    _title_dom.append('<span> is empty !</span>')
}

var appendAtmTr = function(ret) {
    var _table = document.getElementById("atmtable").tBodies[0];

    if (ret.atm.length == 0) {
        return hideTable('atmtable', 'atmtitle');
    }
   
    ret.atm.forEach(function(value, index) {
        var _row = _table.insertRow(_table.rows.length);
        var cell1 = _row.insertCell(0);

        if (! value.ret) {
            cell1.appendChild(getFailDom());
        } else {
            cell1.appendChild(getSpanDom(value.aid));
            cell1.appendChild(getSuccessDom());
        }
    });
}

var appendGtmTr = function(ret) {
    var _table = document.getElementById("gtmtable").tBodies[0];

    if (ret.gtm.length == 0) {
        return hideTable('gtmtable', 'gtmtitle');
    }


    ret.gtm.forEach(function(value, index) {

       // ret.gtm_datahub.forEach(function(gvalue, gindex) {
       //     if (item['gid'] == gvalue['gtm'] && gvalue.ret) {
       //         item['data'] = true;
       //     }
       // });

        var cllect_suc = null;
        var cllect_id = '';
        ret.collect.forEach(function(cvalue, cindex) {
            if (cvalue['gtm'] !=  value.gtm) {
                return;
            }
            cllect_suc = cvalue.ret;
            cllect_id = cvalue['tid'];
        });

//        console.log(getSuccessDom(value.gtm));
        var _row = _table.insertRow(_table.rows.length);
        var cell1 = _row.insertCell(0);
        var cell2 = _row.insertCell(1);

        if (! value.ret) {
            cell1.appendChild(getFailDom());
        } else {
            cell1.appendChild(getSpanDom(value.gtm));
            cell1.appendChild(getSuccessDom());
        }

        if (cllect_suc == null) {
            return;
        }

        if (! cllect_suc) {
            cell2.appendChild(getFailDom());
        } else {
            cell2.appendChild(getSpanDom(cllect_id));
            cell2.appendChild(getSuccessDom());
        }
    });
}

var appendAdTr = function(ret){
    var _table = document.getElementById("adtable").tBodies[0];

    if (ret.ad.length == 0) {
        return hideTable('adtable', 'adtitle');
    }

    console.log(ret);
    ret.ad.forEach(function(value, index) {
        var _row = _table.insertRow(_table.rows.length);
        var cell1 = _row.insertCell(0);
        var cell2 = _row.insertCell(1);

        if (! value.ret) {
            cell1.appendChild(getFailDom());
        } else {
            cell1.appendChild(getSpanDom(value.adid));
            cell1.appendChild(getSuccessDom());
        }

        if (! ret.is_js_suc) {
            cell2.appendChild(getFailDom());
        } else {
            cell2.appendChild(getSuccessDom());
        }
    });

}

var appendGaTr = function(ret){
    var _table = document.getElementById("gatable").tBodies[0];

    if (ret.ga.length == 0) {
        return hideTable('gatable', 'gatitle');
    }

    ret.ga.forEach(function(value, index) {
        var _row = _table.insertRow(_table.rows.length);
        var cell1 = _row.insertCell(0);
        var cell2 = _row.insertCell(1);

        if (! value.ret) {
            cell1.appendChild(getFailDom());
        } else {
            cell1.appendChild(getSpanDom(value.gaid));
            cell1.appendChild(getSuccessDom());
        }

    
        if (! ret.is_js_suc) {
            cell2.appendChild(getFailDom());
        } else {
            cell2.appendChild(getSuccessDom());
        }

    });
}

var appendFbTr = function(ret){
    var _table = document.getElementById("fbtable").tBodies[0];

    if (ret.fb.length == 0) {
        return hideTable('fbtable', 'fbtitle');
    }

    ret.fb.forEach(function(value, index) {
        if (value.ev != 'PageView') {
            return;
        }
        var _row = _table.insertRow(_table.rows.length);
        var cell1 = _row.insertCell(0);
        var cell2 = _row.insertCell(1);

        if (! value.ret) {
            cell1.appendChild(getFailDom());
        } else {
            cell1.appendChild(getSpanDom(value.fid));
            cell1.appendChild(getSuccessDom());
        }

    
        if (! ret.is_js_suc) {
            cell2.appendChild(getFailDom());
        } else {
            cell2.appendChild(getSuccessDom());
        }

    });
}

var getSpanDom = function(str){
        span = document.createElement('span');
        span.innerHTML = str;
        return span;
}

var getSuccessDom = function(){
    var img = document.createElement('img');
    img.src = "images/1495106873_Tick_Mark_Dark.png";
    img.width = '20';

    return img;
}

var getFailDom = function(){
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
