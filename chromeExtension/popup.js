$(document).ready(function(){
    function plugin0()
    {
        return document.getElementById('plugin0');
    }
    $('a.encrypt').click(function(){
        chrome.extension.sendRequest({'messageType':'encrypt',encrypt: {'message':$('#ecmessage').val(),'maillist':$('#recipients').val().split(','),'domel':$(this).attr('id')}}, function(response) {
            var returnMessage = response.message;
            if(returnMessage.length == 1){
                $('#ecmessage').val('Invalid Recipients or no public key found for recipients');   
            }else{
                $('#ecmessage').val(returnMessage);   
            }
        });
    });

    $('div.verify').click(function(){
        $(this).html('');
    });
    $('a.sign').click(function(){
        var gpgPath = localStorage['gpgPath'];
        var tempPath = localStorage['tempPath'];
        if(!gpgPath){
            gpgPath = '/opt/local/bin/'; 
        };
        if(!tempPath){
            tempPath = '/tmp/'; 
        }
        plugin0().appPath = gpgPath;
        plugin0().tempPath = tempPath;
        $('#sigmessage').val(plugin0().clearSignMessage($('#sigmessage').val(),$('#sigPass').val()));   
    });

    $('a.verify').click(function(){
        var gpgPath = localStorage['gpgPath'];
        var tempPath = localStorage['tempPath'];
        if(!gpgPath){
            gpgPath = '/opt/local/bin/'; 
        };
        if(!tempPath){
            tempPath = '/tmp/'; 
        }
        plugin0().appPath = gpgPath;
        plugin0().tempPath = tempPath;
        $('div.verify').text(plugin0().verifyMessage($('#sigmessage').val()) + '. Click to Clear this Message');   
    });

    $('a.import').click(function(){
        var gpgPath = localStorage['gpgPath'];
        var tempPath = localStorage['tempPath'];
        if(!gpgPath){
            gpgPath = '/opt/local/bin/'; 
        };
        if(!tempPath){
            tempPath = '/tmp/'; 
        }
        plugin0().appPath = gpgPath;
        plugin0().tempPath = tempPath;
        $('textarea.message').val(plugin0().importKey($('textarea.message').val()));   
    });
    $('textarea').click(function(){
        if($(this).text() == 'Enter text here'){
            $(this).text(''); 
            return;
        };
        if($(this).text() == 'Please Paste your key here'){
            $(this).text(''); 
            return;
        };

    });
    $('.usedefault-gpg').click(function(){
        $('#gpgPath').val('/opt/local/bin/');
    });
    $('.usedefault-temp').click(function(){
        $('#tempPath').val('/tmp/');
    });
    $('button.save-options').click(function(){
        localStorage["useAutoInclude"] = $('#useAutoInclude')[0].checked;
        if(localStorage["useAutoInclude"] != 'false'){
            if($('#personaladdress').val() != ''){
                localStorage["personaladdress"] =  $('#personaladdress').val();
            }else{
                $('#options-reponse').html('You have ticked self sign but not provided a email address');   
                $('#options-reponse').css('color','red');
                return; 
            }
        };
        var gpgPath = document.getElementById("gpgPath");
        localStorage["gpgPath"] = gpgPath.value;
        var tempPath = document.getElementById("tempPath");
        localStorage["tempPath"] = tempPath.value;
        chrome.extension.sendRequest({'messageType':'testSettings'},function(response){
                if(response == 'failed'){
                    $('#options-reponse').html('options saved but parameters provided are invalid');   
                    $('#options-reponse').css('color','red');
                }else if(response == 'selfsign failed'){
                    localStorage["useAutoInlcude"] = false;
                    $('#options-reponse').html('No public key found for the email address set for Encrypt to self , as such it has been disabled till a valid public key is set');   
                    $('#options-reponse').css('color','red');
                }else{
                    $('#options-reponse').html('options saved');   
                    $('#options-reponse').css('color','green');
                }

        });
    });

    if(localStorage["useAutoInclude"] && localStorage["useAutoInclude"] != 'false'){
        $('#useAutoInclude')[0].checked = true;
    };

    $('#personaladdress').val(localStorage["personaladdress"]);
    $('#gpgPath').val(localStorage["gpgPath"]);
    $('#tempPath').val(localStorage["tempPath"]);

    $(function() {
        $( "#tabs" ).tabs();
    });
});

