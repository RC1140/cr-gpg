$(document).ready(function(){
        //Listen for decrypt click
        var decryptMessageHandler = function(that){
            var messageElement = $('#canvas_frame').contents().find('#'+$(that).attr('decid')).closest('.gs').find('.ii.gt');
            var emailMessage = messageElement.text(); 
            //If this currently exists in the message it means we have a embeded 
            //sig , the - -- indicates this.
            var multiDec = false;
            if(emailMessage.indexOf('- -----BEGIN PGP MESSAGE') !== -1){
                multiDec = true; 
            }
            
            chrome.extension.sendRequest({'messageType':'decrypt',decrypt: {'message':emailMessage,'domel':$(that).attr('decid'),'multidec':multiDec}}, function(response) {
                if(response.message.indexOf('decryption failed') == -1){
                    if(response.message.indexOf('no valid OpenPGP data found') == -1){
                        var messageElement = $('#canvas_frame').contents().find('#'+response.domid.toString()).closest('.gs').find('.ii.gt');
                        if($.trim(response.message).length == 0){
                            alert('Invalid Passphrase'); 
                        }else{
                            $($(messageElement).children()[0]).css('white-space','pre');
                            $($(messageElement).children()[0]).text(response.message); 
                        }
                    }else{
                        alert(response.message);
                    }
                }else{
                    alert(response.message); 
                };
            });                    
        };
        
        var clearSignHandler = function(that){
            event.preventDefault();
            var messageElement = $('#canvas_frame').contents().find($(that)).closest('.fN').find('.Ak');
            var emailMessage = messageElement.val(); 
            jQuery.returnEl = that;
            chrome.extension.sendRequest({'messageType':'sign',sign: {'message':emailMessage}}, function(response) {
                var returnMessage = response.message;
                if(returnMessage.length > 1){
                    var messageElement = $('#canvas_frame').contents().find($(jQuery.returnEl)).closest('.fN').find('.Ak');
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
                        if(/<[^>]*>/.test(emailAddress)){
                            emailAddress = emailAddress.match(/<[^>]*>/)[0].replace('<','').replace('>','');
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

            var encryptionList = [];
            inlineReply.each(function(index,item){
                if($(item).val() != ''){
                    var emailAddress = $(item).val();
                    var splitItems = emailAddress.split(',')
                    $.each(splitItems,function(index,sItem){
                        if(/<[^>]*>/.test(sItem)){
                            sItem = sItem.match(/<[^>]*>/)[0].replace('<','').replace('>','');
                            sItem  = sItem.trim();
                        };
                        encryptionList.push(sItem);
                    });
                    
                }
            });
            
            // encryptionList = encryptionList.replace(/,$/,'').split(',');
            encryptionList = encryptionList.filter(function(val) { return val.trim() !== '' })
            //for(var i=0;i<encryptionList.length;i++){
                //encryptionList[i] = encryptionList[i].trim();
            //};
            
            var emailMessage = $(messageElement).val(); 
            chrome.extension.sendRequest({'messageType':'encrypt',encrypt: {'message':emailMessage,'domel':$(that).attr('id'),'maillist':encryptionList}}, function(response) {
                var returnMessage = response.message;
                if(returnMessage.length > 1){
                    var messageElement = $('#canvas_frame').contents().find('#'+response.domid.toString()).closest('.fN').find('.Ak');
                    if(returnMessage.indexOf('gpg:') != -1){
                        alert(returnMessage); 
                        return;
                    };
                    if (!response.error) {
                        $(messageElement).val(returnMessage);    
                    }else{
                        alert(returnMessage);
                    };
                    
                }else{
                    alert('No public keys found for recipients');
                }
            });
        };
        jQuery.encryptionHandler = encryptionHandler;

        //Load up the decrypt and verify buttons on currently visible emails for the new theme
        var loadButtons = function(items){
            $(items).each(function(loopindex){
                if(!$(this).prev().hasClass('customdec')){
                    var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                    var decryptButton = [ '<a decid="',
                                          id,
                                          '" customFunction="decrypt" ',
                                          'class="T-I J-J5-Ji T-I-Js-IF aaq T-I-ax7 L3 customdec" ',
                                          'style="position:relative;top:7px" role="button" ',
                                          'tabindex="0" style="-webkit-user-select: none; " ',
                                          'aria-label="Decrypt Message" data-tooltip="Decrypt Message">',
                                          '<img role="button" style="padding-top:4px;" ', 
                                          'src="',
                                          chrome.extension.getURL('images/sprite_black2.png'),
                                          '" alt="">',
                                          '</a>' ].join('')
                    var verifyButton = [ '<a id="'+id+'" customFunction="verify" ',
                                          'class="T-I J-J5-Ji T-I-Js-IF aaq T-I-ax7 L3 customdec" ',
                                          'style="position:relative;top:7px" role="button" ',
                                          'tabindex="0" style="-webkit-user-select: none; " ',
                                          'aria-label="Verify Message" data-tooltip="Verify Message">',
                                          '<img role="button" style="padding-top:4px;" ', 
                                          'src="',
                                          chrome.extension.getURL('images/verify.png'),
                                          '" alt="">',
                                          '</a>' ].join('')

                    $(items[loopindex]).before(decryptButton + verifyButton);
                };
            });
        };

        //Generic function handlers
        var loadGenericFunctionHandlers = function(searchLocation){
            $('[customFunction="decrypt"]',searchLocation).unbind('click');
            $('[customFunction="decrypt"]',searchLocation).click(function(){
                event.preventDefault();
                decryptMessageHandler(this);
            });

            $('[customFunction="encrypt"]',searchLocation).unbind('click');
            $('[customFunction="encrypt"]',searchLocation).click(function(){
                event.preventDefault();
                encryptionHandler(this);
            });

            $('[customFunction="composer"]',searchLocation).unbind('click');
            $('[customFunction="composer"]',searchLocation).click(function(){
                event.preventDefault();
                composerHandler(this);
            });
            $('[customFunction="sign"]',searchLocation).unbind('click');
            $('[customFunction="sign"]',searchLocation).click(function(){
                event.preventDefault();
                clearSignHandler(this);
            });

            $('[customFunction="verify"]',searchLocation).unbind('click');
            $('[customFunction="verify"]',searchLocation).click(function(){
                event.preventDefault();
                var messageElement = $(this).closest('.gs').find('.ii.gt').text();

                //Code To handle importing and splitting of external sigs.
                var otherText = $(this).closest('.gs').find('.hq.gt a');
                if(otherText.length > 0){
                    var pairs = $(otherText[0]).attr('href').split('&');
                    var nvpair = {};
                    $.each(pairs, function(i, v){
                      var pair = v.split('=');
                      nvpair[pair[0]] = pair[1];
                    });
                    var superURL = ['https://mail.google.com/mail/u/0/?ui=2&ik=',
                        nvpair.ik,'&view=om&th=',window.location.hash.split('/')[1]].join('');
                    $.get(superURL,function(dat){
                        //Find the bound seperator and store it and remove the search text
                        var boundryRegex = new RegExp(/boundary=".*"/);
                        if(!boundryRegex.test(dat)){
                            boundryRegex = new RegExp(/boundary=.*/);
                        };
                        var separator = boundryRegex.exec(dat)[0];
                        separator = separator.replace('boundary=','').replace('"','');
                        //Split the message with the sperator we found and drop the first 2
                        //and last element , these are just artifacts of the split mostly.
                        var parts = dat.split(separator);
                        parts.splice(0,2);
                        parts.splice(parts.length-1,1);
                        //Remove any trailing --
                        for(var i =0;i<parts.length;i++){
                            parts[i] = parts[i].trim().replace(/--$/g,'').trim();
                        };
                        //Store the parts in their own vars so that we can work on 
                        //them later
                        var origMessage = parts[0].split('\n');
                        var sigDetail = parts[1].split('\n');
                        //Find the first space once we do store the index 
                        //and the splice the array to remove non encoded data which 
                        //is the header data.
                        var cleanMessage = function(message){
                            var i;
                            for(i = 0;i < message.length;i++){
                                if(message[i].trim().length == 0){break;}
                            };
                            message.splice(0,i+1);
                        };
                        cleanMessage(sigDetail); 
                        cleanMessage(origMessage); 
                        origMessage = origMessage.join('\n').trim();
                        sigDetail = sigDetail.join('\n').trim();
                        
                        var request = {
                            'messageType':'verifyDetached',
                            verify: {'message':origMessage,
                                     'sig':sigDetail,
                                     'domel':$(this).attr('id')
                            }
                        };
                        chrome.extension.sendRequest(request, function(response) {
                            var returnMessage = response.message;
                            if(returnMessage.length > 1){
                                alert(returnMessage); 
                                return;
                            }else{
                                alert('No public keys found for recipients');
                            }
                        });

                    });
                }else{

                    chrome.extension.sendRequest({'messageType':'verify',verify: {'message':messageElement,'domel':$(this).attr('id')}}, function(response) {
                        var sigsStatus = "";
                        for(var stat in response.message.signatures){
                            var currenStat = response.message.signatures[stat]
                            sigsStatus += "Signature With Fingerprint :" + currenStat.fingerprint + " [ " +currenStat.status + " ]\n";
                        };
                        if(sigsStatus == ''){
                            sigsStatus = "Unable to verify message";
                        };
                        alert(sigsStatus); 
                    });
                }

                
            });
        };
        
        //Load the decrypt and verify buttons but only for the old theme
        var loadOldThemesButtons = function(searchLocation){
            $('.Bs.nH.iY .cKWzSc.mD[role="button"]',searchLocation).each(function(index){
                if($(this).find('span:contains(Reply)')){
                    if($('#canvas_frame').contents().find('.nH.oy8Mbf span:contains(Switch to the new look)').length !== 0){
                        if($(this).parent().prev().length == 0){
                            var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                            $(this).parent().parent().prepend(['<td><div class="mD"><span class="mG" decid="'+id+'" customFunction="decrypt">Decrypt Message </span></div></td>',
                                '<td><div class="mD"><span class="mG" id="'+id+'" customFunction="verify"> Verify Message</span></div></td>'].join(''));
                        };
                    };
                };
            });
        };
        
        //Old theme support for the compose email section
        var loadComposeButtons = function(searchLocation){
            $('span.es.el:contains(»)',searchLocation).each(function(){
                if(!$(this).prev().hasClass('customdec')){
                    var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                    var newButton = $(this).before(
                        ['<span class="es el customdec" ><a id="'+id+'" customFunction="encrypt">Encrypt Message</a></span><span style="position:relative;top:-5px;">&nbsp;&nbsp;</span>',
                         '<span class="es el customdec" ><a id="'+id+'" customFunction="composer">Compose Message In Popup</a></span><span style="position:relative;top:-5px;">&nbsp;&nbsp;</span>',
                         '<span class="es el customdec" ><a id="'+id+'" customFunction="sign">Sign Message</a> </span><span class="customdec" style="position:relative;top:-5px;">&nbsp;&nbsp;</span>'].join(''));
                };
            });
        };

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

        //Load up buttons on keypress
        $('#canvas_frame').contents().keypress(function(e){
            //Tiny timeout is required so that the html can be rendered
            setTimeout(function(){
                loadButtons($('#canvas_frame').contents().find('tr.acZ td.gH.acX div.T-I-Js-IF')); 
                var highLevelCheck = $('#canvas_frame').contents().find('.nH');
                loadGenericFunctionHandlers(highLevelCheck);
                loadOldThemesButtons(highLevelCheck);
                loadComposeButtons(highLevelCheck);
            },100);
        });

        //Load up buttons on mouseover
        $('#canvas_frame').contents().on('mouseover','.nH',function(){
            loadOldThemesButtons(this);
            loadComposeButtons(this);
            loadButtons($(this).find('tr.acZ td.gH.acX div.T-I-Js-IF')); 
            loadGenericFunctionHandlers(this);
        });
});
