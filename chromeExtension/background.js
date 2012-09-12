var alerted = false;
function plugin0()
{
    return document.getElementById('plugin0');
}

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.messageType == 'encrypt'){
            var mailList = request.encrypt.maillist;
            if( localStorage["useAutoInclude"] && localStorage["useAutoInclude"] != 'false'){
                mailList.push(localStorage["personaladdress"]);
            }
            var mailMessage = request.encrypt.message;
            var currentPubKeyList = [];
            var list = plugin0().getPublicKeyList();
            for(var k in list)
            {
                currentPubKeyList.push(list[k].email);
            }
            for(var encRec in  mailList)
            {
                if(currentPubKeyList.indexOf(mailList[encRec]) == -1){
                    sendResponse({error:true,message: 'You do not have a public key stored for '+mailList[encRec] + ' please remove the user or import their public key',domid:request.encrypt.domel});        
                    return;
                }
                
            }
            
            var enc_result = plugin0().gpgEncrypt(mailMessage, mailList, '', '');
            if(!enc_result.error && enc_result.data){
                sendResponse({message: enc_result.data,domid:request.encrypt.domel});
            }else{
                sendResponse({error:true,message: enc_result.error_string,domid:request.encrypt.domel});
            };
        }else if(request.messageType == 'importkey'){
            var import_status = plugin0().gpgImportKey(request.import.message);
            sendResponse({message: import_status});
        }else if(request.messageType == 'sign'){
            var signing_key = '';
            var privKeySet = plugin0().getPrivateKeyList();
            var keyIDs = Object.keys(privKeySet);
            if(keyIDs.length > 0){
                if(localStorage["signingKeyID"] && localStorage["signingKeyID"] != ''){
                    if(keyIDs.indexOf(localStorage["signingKeyID"]) != -1){
                        signing_key = localStorage["signingKeyID"];
                    }else{
                        if(request.sign.currentMail){
                            for(var sKey in privKeySet){
                                if(privKeySet[sKey].email == request.sign.currentMail){
                                    signing_key = sKey;
                                    break;
                                };
                            }; 
                            if(signing_key == ''){
                                signing_key = keyIDs[0];
                            };
                        }else{
                            signing_key = keyIDs[0];
                        };

                    };
                }else{
                    if(request.sign.currentMail){
                        for(var sKey in privKeySet){
                            if(privKeySet[sKey].email == request.sign.currentMail){
                                signing_key = sKey;
                                break;
                            };
                        }; 
                        if(signing_key == ''){
                            signing_key = keyIDs[0];
                        };
                    }else{
                        signing_key = keyIDs[0];
                    };
                };
            };
            var sign_status = plugin0().gpgSignText([signing_key],request.sign.message, 2);
            sendResponse({message: sign_status,domid:request.sign.domel});
        }else if(request.messageType == 'verify'){    
            var verify_status = plugin0().gpgVerify(request.verify.message);
            sendResponse({message: verify_status ,domid:request.verify.domel})
        }else if(request.messageType == 'verifyDetached'){
            sendResponse({message:'Not Yet Support',domid:request.verify.domel});
            //sendResponse({message: plugin0().verifyMessageDetached(request.verify.message,request.verify.sig),domid:request.verify.domel});
        }else if(request.messageType == 'decrypt'){
            //TODO : Make sure you handle the multidec call which handles encryption within encryption
            var dec_result = plugin0().gpgDecrypt(request.decrypt.message);
            if(!dec_result.error){
                sendResponse({message: dec_result.data,domid:request.decrypt.domel});
            }else{
                sendResponse({message: 'An Error Occured',domid:request.decrypt.domel});
            };
        }else if(request.messageType == 'optionLoad'){
            chrome.tabs.create({'selected':true,'url': chrome.extension.getURL('options.html')});
            sendResponse('options opened');
        }else if(request.messageType == 'testSettings'){
            var returnMessage = plugin0().getPublicKeyList();
            sendResponse(returnMessage);   
        }
    }
);
