$(document).ready(function(){
    function getVersion() {
        if(chrome.app.getDetails()){
            return chrome.app.getDetails().version;
        }else{
            return '' 
        };
    };

    function plugin0()
    {
        return document.getElementById('plugin0');
    }
    $('.encrypt').click(function(){
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
    
    $('.sign').click(function(){
        chrome.extension.sendRequest({'messageType':'sign',sign: {'message':$('#sigmessage').val()}}, function(response) {
            if(!response.message.error){
                $('#sigmessage').val(response.message.data);       
            }else{
                $('#sigmessage').val(JSON.stringify(response.message, undefined, 2));       
            };
        });
    });
    $('.verify').click(function(){
        var verify_status = plugin0().gpgVerify($('#sigmessage').val());
        $('div.verify').text(JSON.stringify(verify_status, undefined, 2));   
    });

    $('.import').click(function(){
        chrome.extension.sendRequest({'messageType':'importkey',import: {'message':$('textarea.message').val()}}, function(response) {
            $('textarea.message').val(JSON.stringify(response.message, undefined, 2));   
        });
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
   
    $("#tabs").tabs();

    
    $('#version').text(getVersion());
});
