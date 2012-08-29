chrome.extension.onRequest.addListener(
function(request, sender, sendResponse) {
    if(request.messageType == 'alertUser'){
        if(!request.gpg){
            alert('No gpg path has been set , please update via the options page for the cr-gpg'); 
            top.userAlerted = true;
        }
        if(!request.temp && !userAlerted){
            alert('No temp path has been set , please update via the options page for the cr-gpg'); 
            top.userAlerted = true;
        }
    }
});

// Saves options to localStorage.
function save_options() {
    localStorage["useAutoInclude"] = $('#useAutoInclude')[0].checked;
    if(localStorage["useAutoInclude"] != 'false'){
        if($('#personaladdress').val() != ''){
            localStorage["personaladdress"] =  $('#personaladdress').val();
        }else{
            alert('You have ticked self sign but not provided a email address');
            return; 
        }
    }

    var tempPath = document.getElementById("tempPath");
    var testTempPath = tempPath.value.toString();
    if(!testTempPath.match(/\/$/)){
        if($.client.os == 'Windows'){
            testTempPath += '\\';
        }else{
            testTempPath += '/';
        }
    };
    localStorage["tempPath"] = testTempPath;
    alert('Saved');
};

// Restores select box state to saved value from localStorage.
function restore_options() {
    var tempPath = document.getElementById("tempPath");
    if(localStorage["tempPath"]){
        tempPath.value = localStorage["tempPath"]; 
    };
    if(localStorage["useAutoInclude"] && localStorage["useAutoInclude"] != 'false'){
        $('#useAutoInclude')[0].checked = true;
    };
    $('#personaladdress').val(localStorage["personaladdress"]);
};

function restore_temp_default() {
    var tempPath = document.getElementById("tempPath");
    switch($.client.os){
        case 'Mac' :
            tempPath.value = '/tmp/'; 
            break;
        case 'Windows' :
            tempPath.value = 'C:\\temp\\'; 
            break;
        case 'Linux' :
            tempPath.value = '/tmp/'; 
            break;
    }
};

$(document).ready(function(){
    $(function() {
        $( "#tabs" ).tabs();
        restore_options();
    });
});
