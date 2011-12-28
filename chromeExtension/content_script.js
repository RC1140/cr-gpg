$(document).ready(function(){
        chrome.extension.sendRequest({'messageType':'checkOptions'});
        //Listen for decrypt click
        var decryptMessageHandler = function(that){
            var messageElement = $('#canvas_frame').contents().find('#'+$(that).attr('decid')).closest('.gs').find('.ii.gt');
            var emailMessage = messageElement.text(); 
            var pp = $('input#passpharsedlg[type="password"]',that).val();
            chrome.extension.sendRequest({'messageType':'decrypt',decrypt: {'passphrase':pp,'message':emailMessage,'domel':$(that).attr('decid')}}, function(response) {
                if(response.message.indexOf('decryption failed') == -1){
                    if(response.message.indexOf('no valid OpenPGP data found') == -1){
                        var messageElement = $('#canvas_frame').contents().find('#'+response.domid.toString()).closest('.gs').find('.ii.gt');
                        var tempMessage = response.message.replace(/\n/g, '<br>');
                        if(tempMessage.indexOf('^') != -1){
                            tempMessage = tempMessage.replace(/\^/g, '<br>');
                            tempMessage = tempMessage.substring(1,tempMessage.length -1);
                        }

                        if($.trim(response.message).length == 0){
                            alert('Invalid Passphrase'); 
                        }else{
                            $($(messageElement).children()[0]).html(tempMessage); 
                        }
                        jQuery.dLoader.dialog("close");
                    }else{
                        alert(response.message); 
                        jQuery.dLoader.dialog("close");
                    }
                }else{
                    alert(response.message); 
                };
            });                    
        };
        
        var clearSignHandler = function(that){
            event.preventDefault();
            var test = $('<div decID="'+$(that).attr('id')+'" title="Please enter your passphrase">Passphrase : <input type="password" width="100%"></input></div>');
            jQuery.dLoader = $(test).dialog({
                width:450,
                buttons: [{
                    text: "Ok",
                    click: function () {
                        var messageElement = $('#canvas_frame').contents().find('#'+$(this).attr('decid')).closest('.fN').find('.Ak');
                        var emailMessage = messageElement.val(); 
                        var pp = $('input[type="password"]',this).val();
                        chrome.extension.sendRequest({'messageType':'sign',sign: {'passphrase':pp,'message':emailMessage,'domel':$(this).attr('decid')}}, function(response) {
                            var returnMessage = response.message;
                            if(returnMessage.length > 1){
                                var messageElement = $('#canvas_frame').contents().find('#'+response.domid.toString()).closest('.fN').find('.Ak');
                                if(returnMessage.indexOf('gpg:') != -1){
                                        alert(returnMessage); 
                                        return;
                                };
                                $(messageElement).val(returnMessage);
                            }else{
                                alert('No public keys found for recipients');
                            }
                            jQuery.dLoader.dialog("close");

                      });                    
                    }
                }, {
                    text: "Cancel",
                    click: function () {
                        $(this).dialog("close");
                    }
                }]
            });
            
        };       

        var composerHandler = function(that){
            event.preventDefault();
            var encryptionList = '';
            var inlineReply = $(that).closest('.gs').find('textarea.dK.nr');
            if(inlineReply.length == 0){
                inlineReply = $(that).closest('.fN').find('textarea.dK.nr');
            };
            inlineReply.each(function(index,item){
                    if($(item).val() != ''){
                        var emailAddress = $(item).val();
                        if(/<.*>/.test(emailAddress)){
                            emailAddress = emailAddress.match(/<.*>/)[0].replace('<','').replace('>','');
                            emailAddress  = emailAddress.trim();
                        };
                        encryptionList += emailAddress +',';
                    }
                });
            encryptionList = encryptionList.replace(/,$/,'').split(',');

            var composerDialog = $(['<div decID="'+$(that).attr('id')+'" ',
                                         'title="Please enter your message"',
                                         'style="font-size: 0.7em;width:400px;diplay;block">',
                                         '<span>Mail Addresses:</span>',
                                         '<input class="emailAddresses" value="'+encryptionList.join(',')+'"></input><br/>',
                                         '<span>Message:</span><br/>',
                                         '<textarea class="composerMessage" rows="10" cols="85" style="font-size: .8em;">',
                                         '</textarea><button customFunction="simpleEncrypt">Encrypt Message</button></div>'].join(' '));
            $(composerDialog).attr('id',$(that).attr('id'));
            var MessageHandler = function(that){
                var messageElement = $('#canvas_frame').contents().find('#'+$(that).attr('id')).closest('.fN').find('.Ak');
                var returnMessage = $('.composerMessage').val();
                if(returnMessage.indexOf('gpg:') != -1){
                    alert(returnMessage); 
                    return;
                };
                $(messageElement).val(returnMessage);
            };

            jQuery.dLoader = $(composerDialog).dialog({
                width:550,
                buttons: [{
                    text: "Insert into Email",
                    click: function(){ 
                        MessageHandler(that); 
                        $(this).dialog("close");
                    }
                }, {
                    text: "Cancel",
                    click: function () {
                        $(this).dialog("close");
                    }
                }]
            });
            

        };
        var encryptionHandler= function(that){
            var messageElement = $('#canvas_frame').contents().find('#'+$(that).attr('id')).closest('.fN').find('.Ak');
            var inlineReply = $(that).closest('.gs').find('textarea.dK.nr');
            if(inlineReply.length == 0){
                inlineReply = $(that).closest('.fN').find('textarea.dK.nr');
            };
            var encryptionList = '';
            inlineReply.each(function(index,item){
                if($(item).val() != ''){
                    var emailAddress = $(item).val();
                    if(/<.*>/.test(emailAddress)){
                        emailAddress = emailAddress.match(/<.*>/)[0].replace('<','').replace('>','');
                        emailAddress  = emailAddress.trim();
                    };
                    encryptionList += emailAddress +',';
                }
            });
            encryptionList = encryptionList.replace(/,$/,'').split(',');
            var emailMessage = $(messageElement).val(); 
            chrome.extension.sendRequest({'messageType':'encrypt',encrypt: {'message':emailMessage,'domel':$(that).attr('id'),'maillist':encryptionList}}, function(response) {
                var returnMessage = response.message;
                if(returnMessage.length > 1){
                    var messageElement = $('#canvas_frame').contents().find('#'+response.domid.toString()).closest('.fN').find('.Ak');
                    if(returnMessage.indexOf('gpg:') != -1){
                        alert(returnMessage); 
                        return;
                    };
                    $(messageElement).val(returnMessage);
                }else{
                    alert('No public keys found for recipients');
                }
            });
        };
        jQuery.encryptionHandler = encryptionHandler;

        $('[customFunction="simpleEncrypt"]').live('click',function(){
            event.preventDefault();
            chrome.extension.sendRequest({'messageType':'encrypt',encrypt: {'message':$('.composerMessage').val(),
                                                                            'maillist':$('.emailAddresses').val().split()}}, function(response) {
                    var returnMessage = response.message;
                    if(returnMessage.length > 1){
                        if(returnMessage.indexOf('gpg:') != -1){
                                alert(returnMessage); 
                                return;
                        };
                        $('.composerMessage').val(returnMessage)
                    }else{
                        alert('No public keys found for recipients');
                    }
                });

        });

        

        $('[customFunction="verify"]').live('click',function(){
                event.preventDefault();
                var messageElement = $(this).closest('.gs').find('.ii.gt').text();
                chrome.extension.sendRequest({'messageType':'verify',verify: {'message':messageElement,'domel':$(this).attr('id')}}, function(response) {
                    var returnMessage = response.message;
                    if(returnMessage.length > 1){
                        var messageElement = $('#'+response.domid.toString()).closest('.gs').find('.ii.gt');
                        alert(returnMessage); 
                        return;
                    }else{
                        alert('No public keys found for recipients');
                    }
                });
        }); 
  
        //Setup monitors for the mail detail section 
        $('*').live('mouseover',function(){

            //$('#canvas_frame').contents().find('.nH .h7 .adn.ads tr.acZ td.gH.acX div.customdec').remove();
            //var items = $('#canvas_frame').contents().find('.nH .h7 .adn.ads tr.acZ td.gH.acX div:first-child');

            $('#canvas_frame').contents().find('.nH .nH .nH .no .nH.nn .nH .nH .oLaOvc.aeJ').mouseover(function(){
                    if(!$(this).find('tr.acZ td.gH.acX div[title="Reply"]').prev().hasClass('customdec')){
                        var items = $(this).find('tr.acZ td.gH.acX div[title="Reply"]');
                        $(items).each(function(loopindex){
                            var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                            var decryptButton = [ '<a id="'+id+'" customFunction="decrypt" ',
                                                  'class="T-I J-J5-Ji T-I-Js-IF aaq T-I-ax7 L3 customdec" ',
                                                  'style="position:relative;top:7px" role="button" ',
                                                  'tabindex="0" style="-webkit-user-select: none; " ',
                                                  'aria-label="Decrypt Message" data-tooltip="Decrypt Message">',
                                                  '<img role="button" style="padding-top:4px;" ', 
                                                  'src="'+chrome.extension.getURL('sprite_black2.png')+'" alt="">',
                                                  '</a>' ].join('')
                            var verifyButton = [ '<a id="'+id+'" customFunction="verify" ',
                                                  'class="T-I J-J5-Ji T-I-Js-IF aaq T-I-ax7 L3 customdec" ',
                                                  'style="position:relative;top:7px" role="button" ',
                                                  'tabindex="0" style="-webkit-user-select: none; " ',
                                                  'aria-label="Verify Message" data-tooltip="Verify Message">',
                                                  '<img role="button" style="padding-top:4px;" ', 
                                                  'src="'+chrome.extension.getURL('verify.png')+'" alt="">',
                                                  '</a>' ].join('')

                            $(items[loopindex]).before(decryptButton + verifyButton); 
                        });
                    }
            });

            //Old theme support for decryption and verification
            $('#canvas_frame').contents().find('.Bs.nH.iY .cKWzSc.mD[role="button"]').each(function(index){
                if($(this).parent().prev().length == 0){
                    var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                    $(this).parent().parent().prepend(['<td><div class="mD"><span class="mG" id="'+id+'" customFunction="decrypt">Decrypt Message </span></div></td>',
                        '<td><div class="mD"><span class="mG" id="'+id+'" customFunction="verify"> Verify Message</span></div></td>'].join(''));
                }
            }); 

            //Old theme support for the compose email section
            if(!$('#canvas_frame').contents().find('span.es.el:contains(Rich)').prev().hasClass('customdec')){
                $('#canvas_frame').contents().find('span.es.el:contains(Rich)').each(function(){
                    if(!$(this).prev().hasClass('customdec')){
                        var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                        var newButton = $(this).before(
                            ['<span class="es el customdec" ><a id="'+id+'" customFunction="encrypt">Encrypt Message</a></span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>',
                             '<span class="es el customdec" ><a id="'+id+'" customFunction="composer">Compose Message In Popup</a></span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>',
                             '<span class="es el customdec" ><a id="'+id+'" customFunction="sign">Sign Message</a> </span><span class="customdec" style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>'].join(''));
                        var signButton = $(this).prev();
                        var composeButton = $(this).prev().prev();
                        var encryptButton = $(this).prev().prev().prev();
                        $('[customFunction="encrypt"]',encryptButton).click(function(){
                            event.preventDefault();
                            encryptionHandler(this);
                        });
                        $('[customFunction="composer"]',composeButton).click(function(){
                            event.preventDefault();
                            composerHandler(this);
                        });
                        $('[customFunction="sign"]',signButton).click(function(){
                            event.preventDefault();
                            clearSignHandler(this);
                        });
                    };
                });
            };
        
            //Inline reply
            $('#canvas_frame').contents().find('.Bs.nH.iY .ip.adB').mouseover(function(){
                if(!$(this).find('.es.el').prev().hasClass('customdec')){
                    var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                    $(this).find('.es.el').before(
                        ['<span class="es el customdec" ><a id="'+id+'" customFunction="encrypt">Encrypt Message</a></span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>',
                        '<span  class="es el customdec" ><a id="'+id+'"  customFunction="composer">Compose Message In Popup</a></span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>',
                        '<span  class="es el customdec" ><a id="'+id+'" customFunction="sign">Sign Message</a> </span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>'
                        ].join(''));
                    $('[customFunction="encrypt"]',this).unbind('click');
                    $('[customFunction="encrypt"]',this).click(function(){
                        event.preventDefault();
                        encryptionHandler(this);
                    });
                    $('[customFunction="composer"]',this).unbind('click');
                    $('[customFunction="composer"]',this).click(function(){
                        event.preventDefault();
                        composerHandler(this);
                    });
                    $('[customFunction="sign"]',this).unbind('click');
                    $('[customFunction="sign"]',this).click(function(){
                        event.preventDefault();
                        clearSignHandler(this);
                    });

                }; 
            })
            $('#canvas_frame').contents().find('.nH .nH .nH .no .nH.nn .oLaOvc.aeJ').mouseover(function(){
                    if(!$(this).find('.es.el').prev().hasClass('customdec')){
                        var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                        $(this).find('.es.el').before(
                            ['<span class="el customdec" role="link" tabindex="2"><a id="'+id+'" customFunction="encrypt">Encrypt Message</a> </span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>',
                            '<span  class="el customdec" role="link" tabindex="2"><a id="'+id+'"  customFunction="composer">Compose Message In Popup</a> </span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>',
                            '<span  class="el customdec" role="link" tabindex="2"><a id="'+id+'" customFunction="sign">Sign Message</a>  </span><span style="position:relative;top:-5px;">&nbsp;|&nbsp;</span>'
                            ].join(''));
                        $('[customFunction="encrypt"]',this).unbind('click');
                        $('[customFunction="encrypt"]',this).click(function(){
                            event.preventDefault();
                            encryptionHandler(this);
                        });
                        $('[customFunction="composer"]',this).unbind('click');
                        $('[customFunction="composer"]',this).click(function(){
                            event.preventDefault();
                            composerHandler(this);
                        });
                        $('[customFunction="sign"]',this).unbind('click');
                        $('[customFunction="sign"]',this).click(function(){
                            event.preventDefault();
                            clearSignHandler(this);
                        });

                    };
            });
            
            //Generic function handlers
            $('#canvas_frame').contents().find('[customFunction="decrypt"]').unbind('click');
            $('#canvas_frame').contents().find('[customFunction="decrypt"]').click(function(){
                event.preventDefault();
                var tempDialog = $('<div decID="'+$(this).attr('id')+'" title="Please enter your passphrase" style="font-size: 0.7em;">Passphrase : <input id="passpharsedlg" type="password" width="100%"></input></div>');
                $(tempDialog).keyup(function(e) {
                    if (e.keyCode == 13) {
                        decryptMessageHandler(this);
                    };
                });

                jQuery.dLoader = $(tempDialog).dialog({
                    width:450,
                    buttons: [{
                        text: "Ok",
                        click: function(){ decryptMessageHandler(this); }
                    }, {
                        text: "Cancel",
                        click: function () {
                            $(this).dialog("close");
                        }
                    }]
                });
            });

            $('#canvas_frame').contents().find('[customFunction="verify"]').unbind('click');
            $('#canvas_frame').contents().find('[customFunction="verify"]').click(function(){
                event.preventDefault();
                var messageElement = $(this).closest('.gs').find('.ii.gt').text();
                chrome.extension.sendRequest({'messageType':'verify',verify: {'message':messageElement,'domel':$(this).attr('id')}}, function(response) {
                    var returnMessage = response.message;
                    if(returnMessage.length > 1){
                        var messageElement = $('#'+response.domid.toString()).closest('.gs').find('.ii.gt');
                        alert(returnMessage); 
                        return;
                    }else{
                        alert('No public keys found for recipients');
                    }
                });
            }); 
        });
});
