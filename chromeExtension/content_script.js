$(document).ready(function(){
        //Listen for decrypt click
        $('[customFunction="decrypt"]').live('click',function(){
            event.preventDefault();
            var test = $('<div decID="'+$(this).attr('id')+'" title="Please enter your passphrase">Passphrase : <input type="password" width="100%"></input></div>');
            jQuery.dLoader = $(test).dialog({
                width:450,
                buttons: [{
                    text: "Ok",
                    click: function () {
                        //var messageElement = $('#'+$(this).attr('decID')).parent().parent().parent().parent().parent().parent().parent().prev().prev().prev().prev().prev();
                        var messageElement = $('#'+$(this).attr('decID')).closest('.gs').find('.ii.gt');
                        var emailMessage = messageElement.text(); 
                        var pp = $('input[type="password"]',this).val();
                        chrome.extension.sendRequest({'messageType':'decrypt',decrypt: {'passphrase':pp,'message':emailMessage,'domel':$(this).attr('decID')}}, function(response) {
                            if(response.message.indexOf('decryption failed') == -1){
                                if(response.message.indexOf('no valid OpenPGP data found') == -1){
                                    var messageElement = $('#'+response.domid.toString()).closest('.gs').find('.ii.gt');
                                    var tempMessage = response.message.replace(/\n/g, '<br>');
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
                    }
                }, {
                    text: "Cancel",
                    click: function () {
                        $(this).dialog("close");
                    }
                }]
            });
            
        });
        //Listen for encrypt click
        $('[customFunction="encrypt"]').live('click',function(){
                    event.preventDefault();
                    var messageElement = $(this).parent().parent().parent().parent().parent().next();
                    var fromList = $(this).parent().parent().parent().parent().parent().parent().prev();
                    var emailList = $('textarea[name="to"].dK.nr',fromList).val().replace(/,$/,'').split(',');
                    var emailMessage = $('.Ak',messageElement).val(); 
                    for(var i=0;i<emailList.length;i++){
                        if(/<.*>/.test(emailList[i])){
                            emailList[i] = emailList[i].match(/<.*>/)[0].replace('<','').replace('>','');
                            emailList[i]  = emailList[i].trim();
                        };
                    };
                    for(var i=0;i<emailList.length;i++){
                        if(emailList[i].trim() == ''){
                            emailList.splice(i,1);
                            //delete emailList[i]; 
                        }
                    };
                    chrome.extension.sendRequest({'messageType':'encrypt',encrypt: {'message':emailMessage,'domel':$(this).attr('id'),'maillist':emailList}}, function(response) {
                        var returnMessage = response.message;
                        if(returnMessage.length > 1){
                            var messageElement = $('#'+response.domid.toString()).parent().parent().parent().parent().parent().next();
                            if(returnMessage.indexOf('gpg:') != -1){
                                    alert(returnMessage); 
                                    return;
                            };
                            $('.Ak',messageElement).val(returnMessage);
                        }else{
                            alert('No public keys found for recipients');
                        }
                    });
        });
        //Setup monitors for the new mail section
        $('.nH').live('mouseover',function(){  // Hook over the total list of messages
                $('.es.el',this).each(function(index){
                    if($(this).parent().prev().length == 0){
                        if($(this).parent().next().length != 0 && $(this).parent().parent().children().length == 3){
                                return;
                        };
                        var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                        $(this)
                            .parent()
                            .parent()
                            .prepend(['<td class="fw" width="130px;">',
                                        '<img class="fB" src="images/cleardot.gif" alt="">',
                                        '<span id="'+id+'" customFunction="encrypt" class="es el">',
                                        '<a>Encrypt Message</a></span></td>'].join(''));
                    }
                });
        });
        //Setup monitors for the mail detail section 
        $('.Bs.nH.iY').live('mouseover',function(){  // Hook over the total list of messages
            $('.es.el',this).each(function(index){
                    if($(this).parent().prev().length == 0){
                        if($(this).parent().next().length != 0 && $(this).parent().parent().children().length == 3){
                                return;
                        };
                        var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                        $(this)
                            .parent()
                            .parent()
                            .prepend(['<td class="fw" width="130px;">',
                                        '<img class="fB" src="images/cleardot.gif" alt="">',
                                        '<span id="'+id+'" customFunction="encrypt" class="es el">',
                                        '<a>Encrypt Message</a></span></td>'].join(''));
                    }
                });

            $('.cKWzSc.mD[role="button"]',this).each(function(index){
                    if($(this).parent().prev().length == 0){
                        var id = Math.floor(Math.random($(this).parent().parent().length)*16777215).toString(16);
                        $(this).parent().parent().prepend('<td><div class="mD"><span class="mG" id="'+id+'" customFunction="decrypt">Decrypt Message </span></div></td>');
                    }
                });
        });
});
