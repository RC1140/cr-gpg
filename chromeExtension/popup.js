$(document).ready(function(){
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
        var signing_key = plugin0().gpgGetPreference('default-key').value;
        var sign_status = plugin0().gpgSignText([signing_key],$('#sigmessage').val(), 2);
        if(!sign_status.error){
            $('#sigmessage').val(sign_status.data);       
        }else{
            $('#sigmessage').val(JSON.stringify(sign_status, undefined, 2));       
        };
        
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
        chrome.extension.sendRequest({'messageType':'testSettings'},function(response){
            alert('Saved');
        });
    });

    if(localStorage["useAutoInclude"] && localStorage["useAutoInclude"] != 'false'){
        $('#useAutoInclude')[0].checked = true;
    };

    $('#personaladdress').val(localStorage["personaladdress"]);
    

    $(function() {
        $( "#tabs" ).tabs();
    });
});

