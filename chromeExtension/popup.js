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
    $(function() {
        $( "#tabs" ).tabs();
    });
});

